import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as tls from 'node:tls'
import { env } from '../config/env'
import { fail } from './conversation'

interface GmailRuntimeConfig {
  gmailUser: string
  gmailAppPassword: string
  senderName?: string
}

const configPath = resolve(__dirname, '../../../../.local/gmail-config.json')
let runtimeGmail: GmailRuntimeConfig | null = null

function loadRuntimeGmail(): GmailRuntimeConfig | null {
  if (runtimeGmail) return runtimeGmail
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    return {
      gmailUser: env.GMAIL_USER.trim(),
      gmailAppPassword: env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
      senderName: 'Bravechat',
    }
  }
  try {
    if (existsSync(configPath)) {
      const raw = JSON.parse(readFileSync(configPath, 'utf8'))
      if (raw?.gmailUser && raw?.gmailAppPassword) {
        runtimeGmail = {
          gmailUser: String(raw.gmailUser).trim(),
          gmailAppPassword: String(raw.gmailAppPassword).replace(/\s+/g, ''),
          senderName: 'Bravechat',
        }
        return runtimeGmail
      }
    }
  } catch {
    // Ignore invalid local config file
  }
  return null
}

export function getGmailStatus() {
  const cfg = loadRuntimeGmail()
  return {
    configured: Boolean(cfg?.gmailUser && cfg?.gmailAppPassword),
    gmailUser: cfg?.gmailUser ? maskEmailAddress(cfg.gmailUser) : null,
    provider: cfg ? 'gmail_smtp' : env.RESEND_API_KEY ? 'resend' : 'development_mailbox',
  }
}

export function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(6, Math.max(3, local.length - 3)))}${local.slice(-1)}@${domain}`
}

export const developmentMailbox = () =>
  env.NODE_ENV !== 'production' && !env.RESEND_API_KEY && !loadRuntimeGmail()

/**
 * Native RFC 5321 / RFC 4954 SMTP-over-TLS client for smtp.gmail.com:465
 */
export async function sendViaGmailSmtp(options: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  const cfg = loadRuntimeGmail()
  if (!cfg) throw fail(503, 'Dich vu gui email chua duoc cau hinh.')
  const host = env.SMTP_HOST || 'smtp.gmail.com'
  const port = env.SMTP_PORT || 465
  const fromName = 'Bravechat'

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: true },
      () => {
        // Connected TLS socket
      }
    )

    let buffer = ''
    let step = 0
    let finished = false
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true
        socket.destroy()
        rejectPromise(fail(504, 'Ket noi toi may chu Gmail SMTP qua thoi gian cho.'))
      }
    }, 15000)

    const finish = (err?: Error) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      socket.destroy()
      if (err) rejectPromise(err)
      else resolvePromise()
    }

    const sendLine = (line: string) => {
      socket.write(line + '\r\n')
    }

    const boundary = `bravechat_mime_${Date.now().toString(36)}`
    const encodedSubject = `=?UTF-8?B?${Buffer.from(options.subject, 'utf8').toString('base64')}?=`
    const encodedFromName = `=?UTF-8?B?${Buffer.from(fromName, 'utf8').toString('base64')}?=`
    const base64Text = (Buffer.from(options.text, 'utf8').toString('base64').match(/.{1,76}/g) || []).join('\r\n')
    const base64Html = (Buffer.from(options.html, 'utf8').toString('base64').match(/.{1,76}/g) || []).join('\r\n')

    const mimeMessage = [
      `From: ${encodedFromName} <${cfg.gmailUser}>`,
      `To: <${options.to}>`,
      `Subject: ${encodedSubject}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      '',
      base64Text,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      '',
      base64Html,
      '',
      `--${boundary}--`,
      '.',
    ].join('\r\n')

    socket.on('error', (err) => {
      finish(fail(503, `Loi ket noi Gmail SMTP: ${err.message}`))
    })

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split('\r\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line) continue
        if (line.length >= 4 && line[3] === '-') continue
        const code = parseInt(line.slice(0, 3), 10)

        if (code >= 400) {
          if (code === 535) {
            return finish(fail(401, 'Xac thuc Gmail that bai. Vui long kiem tra tai khoan va mat khau ung dung.'))
          }
          return finish(fail(503, `May chu Gmail SMTP tu choi yeu cau (${code}): ${line}`))
        }

        if (step === 0 && code === 220) {
          step = 1
          sendLine('EHLO localhost')
        } else if (step === 1 && code === 250) {
          step = 2
          sendLine('AUTH LOGIN')
        } else if (step === 2 && code === 334) {
          step = 3
          sendLine(Buffer.from(cfg.gmailUser, 'utf8').toString('base64'))
        } else if (step === 3 && code === 334) {
          step = 4
          sendLine(Buffer.from(cfg.gmailAppPassword, 'utf8').toString('base64'))
        } else if (step === 4 && code === 235) {
          step = 5
          sendLine(`MAIL FROM:<${cfg.gmailUser}>`)
        } else if (step === 5 && code === 250) {
          step = 6
          sendLine(`RCPT TO:<${options.to}>`)
        } else if (step === 6 && code === 250) {
          step = 7
          sendLine('DATA')
        } else if (step === 7 && code === 354) {
          step = 8
          sendLine(mimeMessage)
        } else if (step === 8 && code === 250) {
          step = 9
          sendLine('QUIT')
          finish()
        }
      }
    })
  })
}

async function writeLocalMailFile(filenamePrefix: string, payload: Record<string, unknown>) {
  if (env.NODE_ENV === 'production') return
  const directory = resolve(__dirname, '../../../../.local/mail')
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, `${filenamePrefix}.json`), JSON.stringify(payload, null, 2), { mode: 0o600 })
}

async function deliverEmail(options: {
  to: string
  subject: string
  text: string
  html: string
  localFilePrefix: string
  localMeta?: Record<string, unknown>
}): Promise<'gmail' | 'resend' | 'development'> {
  await writeLocalMailFile(options.localFilePrefix, {
    to: options.to,
    subject: options.subject,
    text: options.text,
    ...options.localMeta,
    createdAt: new Date().toISOString(),
  })

  // Never send live emails to synthetic test domains used in CI / integration tests
  if (options.to.endsWith('.test') || options.to.endsWith('.example')) {
    return 'development'
  }

  const gmail = loadRuntimeGmail()
  if (gmail) {
    await sendViaGmailSmtp({
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
    return 'gmail'
  }

  if (env.RESEND_API_KEY && env.RESET_EMAIL_FROM) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESET_EMAIL_FROM,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw fail(503, 'Khong the gui email qua Resend. Vui long thu lai sau.')
    return 'resend'
  }

  if (env.NODE_ENV === 'production') {
    throw fail(503, 'Dich vu gui email chua duoc cau hinh.')
  }

  return 'development'
}

/**
 * Builds standard Discord-styled transactional email template (Image 4 reference)
 */
function buildDiscordEmailTemplate(content: {
  heading: string
  bodyText: string
  buttonLabel?: string
  buttonUrl?: string
  codeBlock?: string
  footerNote?: string
}): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bravechat</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f2f3f5; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f2f3f5; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Brand Header -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto 24px auto;">
          <tr>
            <td align="center">
              <span style="font-size: 26px; font-weight: 800; color: #0077b6; letter-spacing: -0.5px; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                Brave<span style="color: #00b4d8;">chat</span>
              </span>
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin: 0 auto;">
          <tr>
            <td style="padding: 40px 48px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #2e3338; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                ${content.heading}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #4f5660; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                ${content.bodyText}
              </p>

              ${
                content.codeBlock
                  ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                      <tr>
                        <td align="center" style="background-color: #f2f3f5; border-radius: 4px; padding: 18px;">
                          <span style="font-family: Consolas, Monaco, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0077b6;">
                            ${content.codeBlock}
                          </span>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }

              ${
                content.buttonUrl && content.buttonLabel
                  ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${content.buttonUrl}" target="_blank" style="background-color: #0077b6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px; display: inline-block; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                            ${content.buttonLabel}
                          </a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }

              <!-- Divider -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px; border-top: 1px solid #ebedef;">
                <tr>
                  <td style="padding-top: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 18px; color: #747f8d; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                      ${content.footerNote || `Cần giúp đỡ? <a href="${env.FRONTEND_URL}" style="color: #0077b6; text-decoration: underline;">Hãy liên hệ đội ngũ hỗ trợ của chúng tôi</a> hoặc phản hồi trực tiếp email này.`}
                    </p>
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #747f8d; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                      Muốn cung cấp phản hồi? Hãy cho chúng tôi biết ý kiến của bạn trên <a href="${env.FRONTEND_URL}" style="color: #0077b6; text-decoration: underline;">trang phản hồi</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- External Footer -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 20px auto 0 auto;">
          <tr>
            <td align="center" style="font-size: 11px; line-height: 16px; color: #99aab5; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              Được gửi bởi Bravechat • <a href="${env.FRONTEND_URL}" style="color: #0077b6; text-decoration: underline;">Tham khảo blog của chúng tôi</a> • @bravechat
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendResetMail(email: string, token: string, username?: string) {
  const url = new URL('/reset-password', env.FRONTEND_URL)
  url.searchParams.set('token', token)
  const greeting = username ? `Hey ${username},` : `Hey,`
  const subject = 'Yêu Cầu Đặt Lại Mật Khẩu Bravechat'
  const text =
    `${greeting}\n\n` +
    `Your Bravechat password can be reset by clicking the button below. If you did not request a new password, please ignore this email.\n\n` +
    `${url.toString()}\n\n` +
    `Liên kết có hiệu lực trong 15 phút và chỉ sử dụng một lần duy nhất.\n\n` +
    `Được gửi bởi Bravechat.`

  const html = buildDiscordEmailTemplate({
    heading: greeting,
    bodyText:
      'Your Bravechat password can be reset by clicking the button below. If you did not request a new password, please ignore this email.',
    buttonLabel: 'Reset Password',
    buttonUrl: url.toString(),
  })

  return deliverEmail({
    to: email,
    subject,
    text,
    html,
    localFilePrefix: token.slice(0, 16),
    localMeta: { url: url.toString() },
  })
}

export async function sendVerificationOtpMail(
  email: string,
  otpCode: string,
  purpose: 'login' | 'verify_email' = 'login',
  meta?: Record<string, unknown>
) {
  const title =
    purpose === 'login'
      ? 'Mã Xác Minh Đăng Nhập Bravechat'
      : 'Mã Xác Minh Địa Chỉ Email Bravechat'
  const subject = `${title}: ${otpCode}`
  const text =
    `Chào bạn,\n\n` +
    `Mã xác minh bảo mật tài khoản Bravechat của bạn là: ${otpCode}\n` +
    `Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n` +
    `Được gửi bởi Bravechat.`

  const html = buildDiscordEmailTemplate({
    heading: 'Xác minh bảo mật tài khoản',
    bodyText:
      'Sử dụng mã xác minh gồm 6 chữ số dưới đây để tiếp tục. Mã có hiệu lực trong vòng 5 phút và chỉ sử dụng một lần.',
    codeBlock: otpCode,
    footerNote:
      'Nếu bạn không thực hiện thao tác này, hãy kiểm tra và đổi mật khẩu ngay lập tức để bảo vệ tài khoản của bạn.',
  })

  return deliverEmail({
    to: email,
    subject,
    text,
    html,
    localFilePrefix: `otp_${Date.now()}_${otpCode}`,
    localMeta: { otpCode, purpose, ...(meta || {}) },
  })
}

export async function saveGmailConfig(gmailUser: string, gmailAppPassword: string) {
  const cleanUser = gmailUser.trim()
  const cleanPassword = gmailAppPassword.replace(/\s+/g, '')
  runtimeGmail = {
    gmailUser: cleanUser,
    gmailAppPassword: cleanPassword,
    senderName: 'Bravechat',
  }
  const directory = resolve(__dirname, '../../../../.local')
  await mkdir(directory, { recursive: true })
  await writeFile(
    configPath,
    JSON.stringify({ gmailUser: cleanUser, gmailAppPassword: cleanPassword }, null, 2),
    { mode: 0o600 }
  )
  return getGmailStatus()
}
