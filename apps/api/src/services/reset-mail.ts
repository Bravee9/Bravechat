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
  const webhookUrl = (env as { GMAIL_WEBHOOK_URL?: string }).GMAIL_WEBHOOK_URL
  const resendReady = Boolean(env.RESEND_API_KEY)
  const configured = Boolean(webhookUrl || resendReady || (cfg?.gmailUser && cfg?.gmailAppPassword))
  // Do not expose internal sender email address or infrastructure provider in production responses
  if (env.NODE_ENV === 'production') {
    return {
      configured,
      gmailUser: null,
      provider: configured ? 'configured' : 'unconfigured',
    }
  }
  return {
    configured,
    gmailUser: cfg?.gmailUser ? maskEmailAddress(cfg.gmailUser) : null,
    provider: webhookUrl
      ? 'gmail_webhook'
      : resendReady
        ? 'resend'
        : cfg
          ? 'gmail_smtp'
          : 'development_mailbox',
  }
}

export function maskEmailAddress(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(6, Math.max(3, local.length - 3)))}${local.slice(-1)}@${domain}`
}

export const developmentMailbox = () =>
  env.NODE_ENV !== 'production' &&
  !env.RESEND_API_KEY &&
  !(env as { GMAIL_WEBHOOK_URL?: string }).GMAIL_WEBHOOK_URL &&
  !loadRuntimeGmail()

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
  const fromName = 'Bravechat Account'

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
        rejectPromise(
          fail(
            504,
            'Không thể kết nối tới máy chủ gửi thư (cổng SMTP có thể bị chặn — hãy cấu hình GMAIL_WEBHOOK_URL hoặc RESEND_API_KEY qua HTTPS).'
          )
        )
      }
    }, 8000)

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

    socket.on('error', () => {
      finish(
        fail(
          503,
          'Không thể kết nối máy chủ gửi thư qua cổng SMTP (vui lòng cấu hình GMAIL_WEBHOOK_URL hoặc RESEND_API_KEY để gửi qua HTTPS).'
        )
      )
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
            return finish(fail(401, 'Xác thực dịch vụ gửi thư thất bại.'))
          }
          return finish(fail(503, `Máy chủ gửi thư từ chối yêu cầu (${code}).`))
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

export async function sendViaGmailWebhook(options: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  const webhookUrl = (env as { GMAIL_WEBHOOK_URL?: string }).GMAIL_WEBHOOK_URL
  if (!webhookUrl) throw fail(503, 'Chưa cấu hình GMAIL_WEBHOOK_URL.')
  const cfg = loadRuntimeGmail()
  const secret = cfg?.gmailAppPassword || env.GMAIL_APP_PASSWORD || ''
  const response = await fetch(webhookUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      senderName: 'Bravechat Account',
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    throw fail(503, 'Không thể gửi email qua HTTPS Webhook. Vui lòng kiểm tra lại cấu hình.')
  }
  const body = (await response.json().catch(() => ({ ok: true }))) as { ok?: boolean; error?: string }
  if (body && body.ok === false) {
    throw fail(503, body.error || 'Dịch vụ HTTPS Webhook từ chối gửi thư.')
  }
}

async function sendViaResendHttps(options: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  const from = env.RESET_EMAIL_FROM || 'Bravechat Account <onboarding@resend.dev>'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) {
    throw fail(
      503,
      'Không thể gửi email qua Resend HTTPS API.'
    )
  }
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
  if (env.NODE_ENV !== 'production' && (options.to.endsWith('.test') || options.to.endsWith('.example'))) {
    return 'development'
  }

  const webhookUrl = (env as { GMAIL_WEBHOOK_URL?: string }).GMAIL_WEBHOOK_URL
  if (webhookUrl) {
    await sendViaGmailWebhook(options)
    return 'gmail'
  }

  if (env.RESEND_API_KEY) {
    await sendViaResendHttps(options)
    return 'resend'
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

  if (env.NODE_ENV === 'production') {
    throw fail(503, 'Dịch vụ gửi email chưa được cấu hình.')
  }

  return 'development'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Clean, left-aligned editorial transactional email template.
 * Structured so Gmail automatically extracts the 6-digit one-time code into its top smart-copy card.
 */
function buildMinimalEditorialEmailTemplate(content: {
  greeting: string
  introText: string
  codeBlock?: string
  actionText?: string
  actionLabel?: string
  actionUrl?: string
  disclaimerText: string
}): string {
  const siteHost = escapeHtml(env.FRONTEND_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''))
  const supportUrl = escapeHtml(`${env.FRONTEND_URL.replace(/\/$/, '')}/docs`)
  const safeFrontendUrl = escapeHtml(env.FRONTEND_URL)
  const safeGreeting = escapeHtml(content.greeting)
  const safeIntro = escapeHtml(content.introText)
  const safeCode = content.codeBlock ? escapeHtml(content.codeBlock) : undefined
  const safeActionText = content.actionText ? escapeHtml(content.actionText) : undefined
  const safeActionLabel = content.actionLabel ? escapeHtml(content.actionLabel) : undefined
  const safeActionUrl = content.actionUrl ? escapeHtml(content.actionUrl) : undefined
  const safeDisclaimer = escapeHtml(content.disclaimerText)

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bravechat Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; color: #19191c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; padding: 28px 20px; font-size: 14px; line-height: 22px; color: #19191c;">
    <p style="margin: 0 0 20px 0;">
      ${safeGreeting}
    </p>

    <p style="margin: 0 0 16px 0;">
      ${safeIntro}
    </p>

    ${
      safeCode
        ? `<p style="margin: 8px 0 24px 0; font-size: 24px; line-height: 32px; font-weight: 700; color: #19191c; letter-spacing: 0.5px;">${safeCode}</p>`
        : ''
    }

    ${
      safeActionUrl && safeActionLabel
        ? `<p style="margin: 0 0 20px 0;">
            ${safeActionText ? `${safeActionText} ` : ''}<a href="${safeActionUrl}" target="_blank" style="color: #1a659e; text-decoration: underline;">${safeActionLabel}</a>.
          </p>`
        : ''
    }

    <p style="margin: 0 0 28px 0; color: #19191c;">
      ${safeDisclaimer} Nếu có bất kỳ câu hỏi nào, vui lòng <a href="${supportUrl}" target="_blank" style="color: #1a659e; text-decoration: underline;">liên hệ đội ngũ hỗ trợ</a>.
    </p>

    <p style="margin: 0; font-style: italic; color: #19191c; line-height: 24px;">
      Trân trọng,<br>
      Đội ngũ Bravechat<br>
      <a href="${safeFrontendUrl}" target="_blank" style="color: #1a659e; text-decoration: underline;">${siteHost}</a><br>
      Communicate, Freely.
    </p>
  </div>
</body>
</html>`
}

export async function sendResetMail(email: string, token: string, username?: string, otpCode?: string) {
  const url = new URL('/reset-password', env.FRONTEND_URL)
  url.searchParams.set('token', token)
  const greeting = username ? `Xin chào ${username}!` : `Xin chào!`
  const subject = 'Mã xác nhận khôi phục mật khẩu cho tài khoản Bravechat của bạn'
  const text =
    `${greeting}\n\n` +
    `Đây là mã xác nhận dùng một lần (one-time confirmation code) để đặt lại mật khẩu tài khoản Bravechat của bạn:\n\n` +
    (otpCode ? `${otpCode}\n\n` : '') +
    `Hoặc đặt lại mật khẩu trực tiếp qua liên kết bảo mật (hiệu lực 15 phút): ${url.toString()}\n\n` +
    `Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email này.\n\n` +
    `Trân trọng,\nĐội ngũ Bravechat\n${env.FRONTEND_URL}`

  const html = buildMinimalEditorialEmailTemplate({
    greeting,
    introText:
      'Đây là mã xác nhận dùng một lần (one-time code) để xác nhận yêu cầu đặt lại mật khẩu cho địa chỉ email của bạn:',
    codeBlock: otpCode,
    actionText: 'Hoặc bạn có thể',
    actionLabel: 'đặt lại mật khẩu trực tiếp tại liên kết này',
    actionUrl: url.toString(),
    disclaimerText: 'Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email này.',
  })

  return deliverEmail({
    to: email,
    subject,
    text,
    html,
    localFilePrefix: token.slice(0, 16),
    localMeta: { url: url.toString(), ...(otpCode ? { otpCode } : {}) },
  })
}

export async function sendVerificationOtpMail(
  email: string,
  otpCode: string,
  purpose: 'login' | 'verify_email' = 'login',
  meta?: Record<string, unknown>
) {
  const subject =
    purpose === 'login'
      ? 'Mã xác nhận đăng nhập cho tài khoản Bravechat của bạn'
      : 'Mã xác nhận địa chỉ email cho tài khoản Bravechat của bạn'
  const text =
    `Xin chào!\n\n` +
    `Đây là mã xác nhận dùng một lần (one-time confirmation code) để xác nhận địa chỉ email cá nhân của bạn:\n\n` +
    `${otpCode}\n\n` +
    `Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email này.\n\n` +
    `Trân trọng,\nĐội ngũ Bravechat\n${env.FRONTEND_URL}`

  const html = buildMinimalEditorialEmailTemplate({
    greeting: 'Xin chào!',
    introText:
      'Đây là mã xác nhận dùng một lần (one-time code) để xác nhận địa chỉ email cá nhân của bạn:',
    codeBlock: otpCode,
    disclaimerText:
      'Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email này.',
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
    senderName: 'Bravechat Account',
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
