import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { env } from '../config/env'
import { fail } from './conversation'

export const developmentMailbox = () => env.NODE_ENV !== 'production' && !env.RESEND_API_KEY
// Local ghi thư vào thư mục được Git bỏ qua; production phải gửi qua nhà cung cấp thật.
// Không trả token cho frontend hoặc log token ra console.
export async function sendResetMail(email: string, token: string) {
  const url = new URL('/reset-password', env.FRONTEND_URL)
  url.searchParams.set('token', token)
  const text = 'Bạn đã yêu cầu đặt lại mật khẩu Bravechat. Liên kết có hiệu lực 15 phút và chỉ dùng một lần:\n\n' + url.toString()
  if (developmentMailbox()) {
    const directory = resolve(__dirname, '../../../../.local/mail')
    await mkdir(directory, { recursive: true })
    await writeFile(resolve(directory, token.slice(0, 16) + '.json'), JSON.stringify({ to: email, subject: 'Đặt lại mật khẩu Bravechat', text, url: url.toString(), createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 })
    console.log(`\n📨 [DEV MAILBOX] Đã tạo liên kết đặt lại mật khẩu cho ${email}:`)
    console.log(`👉 ${url.toString()}\n`)
    return
  }
  if (!env.RESEND_API_KEY || !env.RESET_EMAIL_FROM) throw fail(503, 'Dịch vụ gửi email chưa được cấu hình.')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.RESET_EMAIL_FROM, to: [email], subject: 'Đặt lại mật khẩu Bravechat', text }),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw fail(503, 'Không thể gửi email. Vui lòng thử lại sau.')
}
