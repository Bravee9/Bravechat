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
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f2f3f5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Brand Header -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin-bottom: 24px;">
          <tr>
            <td align="center">
              <span style="font-size: 26px; font-weight: 800; color: #0077b6; letter-spacing: -0.5px;">Bravechat</span>
            </td>
          </tr>
        </table>

        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding: 40px 48px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #2e3338;">
                ${content.heading}
              </h2>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4f5660;">
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
                  ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                      <tr>
                        <td align="center">
                          <a href="${content.buttonUrl}" style="background-color: #0077b6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px; display: inline-block;">
                            ${content.buttonLabel}
                          </a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }

              ${
                content.buttonUrl
                  ? `<p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: #747f8d; word-break: break-all;">
                      Hoac sao chep va mo lien ket sau trong trinh duyet:<br />
                      <a href="${content.buttonUrl}" style="color: #0077b6; text-decoration: underline;">${content.buttonUrl}</a>
                    </p>`
                  : ''
              }

              <!-- Divider -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px; border-top: 1px solid #ebedef;">
                <tr>
                  <td style="padding-top: 24px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #747f8d;">
                      ${content.footerNote || 'Can giup do? Hay lien he doi ngu ho tro cua chung toi hoac phan hoi truc tiep email nay.'}
                    </p>
                    <p style="margin: 12px 0 0; font-size: 11px; color: #99aab5;">
                      Duoc gui boi Bravechat
                    </p>
                  </td>
                </tr>
              </table>
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
    `Ban co the dat lai mat khau Bravechat bang cach mo lien ket ben duoi. Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.\n\n` +
    `${url.toString()}\n\n` +
    `Lien ket co hieu luc trong 15 phut va chi su dung mot lan duy nhat.\n` +
    `Duoc gui boi Bravechat.`

  const html = buildDiscordEmailTemplate({
    heading: greeting,
    bodyText:
      'Ban co the dat lai mat khau Bravechat bang cach nhan vao nut ben duoi. Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.',
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
      ? 'Ma Xac Minh Dang Nhap Bravechat'
      : 'Ma Xac Minh Dia Chi Email Bravechat'
  const subject = `${title}: ${otpCode}`
  const text =
    `Chao ban,\n\n` +
    `Ma xac minh bao mat tai khoan Bravechat cua ban la: ${otpCode}\n` +
    `Ma co hieu luc trong 5 phut. Vui long khong chia se ma nay cho bat ky ai.\n\n` +
    `Duoc gui boi Bravechat.`

  const html = buildDiscordEmailTemplate({
    heading: 'Xac minh bao mat tai khoan',
    bodyText:
      'Su dung ma xac minh gom 6 chu so duoi day de tiep tuc. Ma co hieu luc trong vong 5 phut va chi su dung mot lan.',
    codeBlock: otpCode,
    footerNote:
      'Neu ban khong thuc hien thao tac nay, hay kiem tra va doi mat khau ngay lap tuc de bao ve tai khoan cua ban.',
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
