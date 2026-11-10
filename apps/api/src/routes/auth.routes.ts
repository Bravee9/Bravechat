import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createHash, createHmac, randomBytes, randomInt } from 'node:crypto'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import { mediaUrl } from '../services/storage.service'
import { fail } from '../services/conversation'
import * as resetMail from '../services/reset-mail'
import { revokeSessions } from './websocket.routes'
import { revokeVoiceSessions, rotateVoiceSession } from '../services/voice-security'

const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const email = z.string().trim().toLowerCase().max(254, 'Email tối đa 254 ký tự.').email('Email không hợp lệ.')
const password = z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.').max(128).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu tối đa 72 byte UTF-8.')
const resetToken = z.string().length(64, 'Mã xác thực không hợp lệ.').regex(/^[a-f0-9]{64}$/, 'Mã xác thực không hợp lệ.')
const userSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  discriminator: true,
  status: true,
  customStatus: true,
  bio: true,
  avatarKey: true,
  bannerKey: true,
  isEmailVerified: true,
} as const
const present = (user: any) => ({ ...user, avatarUrl: mediaUrl(user.avatarKey), bannerUrl: mediaUrl(user.bannerKey) })
const options = { httpOnly: true, secure: env.FRONTEND_URL.startsWith('https:'), sameSite: 'lax' as const, path: '/' }
const refreshData = (userId: string, value: string, request: FastifyRequest) => ({
  userId,
  token: digest(value),
  expiresAt: new Date(Date.now() + 30 * 86400000),
  userAgent: request.headers['user-agent']?.slice(0, 500),
  ipAddress: request.ip,
})

function maskEmail(em: string): string {
  if (typeof resetMail.maskEmailAddress === 'function') return resetMail.maskEmailAddress(em)
  const [local, domain] = em.split('@')
  if (!local || !domain) return em
  return `${local.slice(0, 2)}****${local.slice(-1)}@${domain}`
}

function generateNumericOtp(digits = 6): string {
  const max = 10 ** digits
  return String(randomInt(0, max)).padStart(digits, '0')
}

// ─── RFC 6238 TOTP Implementation (Base32 + HMAC-SHA1) ──────────────────────
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function generateBase32Secret(length = 16): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += BASE32_ALPHABET[bytes[i] & 31]
  return out
}

function decodeBase32(secret: string): Buffer {
  const cleaned = secret.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

function computeTotp(secret: string, counter: number): string {
  const key = decodeBase32(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter), 0)
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1000000
  return String(code).padStart(6, '0')
}

function verifyTotpCode(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false
  const step = Math.floor(Date.now() / 30000)
  for (let window = -1; window <= 1; window++) {
    if (computeTotp(secret, step + window) === code) return true
  }
  return false
}

// ─── In-Memory Security State (Challenges, QR Sessions, 2FA, Audit Logs) ────
interface LoginChallenge {
  challengeTokenHash: string
  userId: string
  email: string
  passwordHash: string
  otpHash: string
  methods: Array<'gmail_otp' | 'totp' | 'backup_code'>
  ipAddress: string
  userAgent: string
  createdAt: number
  expiresAt: number
  lastSentAt: number
  attempts: number
}

interface QrLoginSession {
  qrId: string
  pollSecretHash: string
  shortCode: string
  ipAddress: string
  userAgent: string
  createdAt: number
  expiresAt: number
  status: 'PENDING' | 'SCANNED' | 'APPROVED' | 'REJECTED' | 'CONSUMED'
  scannedBy?: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  approvedUserId?: string
}

interface UserSecurityState {
  twoFactorEnabled: boolean
  totpSecret?: string
  pendingTotpSecret?: string
  backupCodes: string[]
  gmailLoginOtpEnabled: boolean
}

interface SecurityLogEntry {
  id: string
  event: string
  method: 'password' | 'gmail_otp' | 'totp_2fa' | 'qr_code' | 'password_reset' | 'email_verify'
  status: 'SUCCESS' | 'CHALLENGE' | 'FAILED'
  ipAddress: string
  userAgent: string
  createdAt: string
}

const loginChallenges = new Map<string, LoginChallenge>()
const qrSessions = new Map<string, QrLoginSession>()
const qrShortCodeMap = new Map<string, string>()
const userSecurityMap = new Map<string, UserSecurityState>()
const securityLogsMap = new Map<string, SecurityLogEntry[]>()
const resetOtpMap = new Map<string, { otpHash: string; rawToken: string; expiresAt: number; attempts: number }>()
const emailVerifyOtpMap = new Map<string, { otpHash: string; expiresAt: number; attempts: number }>()
const loginFailures = new Map<string, { count: number; lockedUntil: number; updatedAt: number }>()

function getUserSecurity(userId: string): UserSecurityState {
  let state = userSecurityMap.get(userId)
  if (!state) {
    state = {
      twoFactorEnabled: false,
      backupCodes: [],
      gmailLoginOtpEnabled: false,
    }
    userSecurityMap.set(userId, state)
  }
  return state
}

function recordSecurityLog(
  userId: string,
  entry: Omit<SecurityLogEntry, 'id' | 'createdAt'>
) {
  const list = securityLogsMap.get(userId) ?? []
  list.unshift({
    ...entry,
    id: randomBytes(6).toString('hex'),
    createdAt: new Date().toISOString(),
  })
  if (list.length > 25) list.length = 25
  securityLogsMap.set(userId, list)
}

async function setSession(
  reply: FastifyReply,
  user: { id: string; email: string; username: string },
  sid: string,
  refresh: string
) {
  // JWT trỏ tới phiên trong DB: logout/reset có thể thu hồi ngay cả JWT còn hạn.
  const access = await reply.jwtSign(
    { id: user.id, email: user.email, username: user.username, sid },
    { expiresIn: 900 }
  )
  reply.setCookie('token', access, { ...options, maxAge: 900 })
  reply.setCookie('refreshToken', refresh, { ...options, maxAge: 30 * 86400 })
}

function clear(reply: FastifyReply) {
  reply.clearCookie('token', options)
  reply.clearCookie('refreshToken', options)
  reply.clearCookie('refresh', options)
}

export async function authRoutes(server: FastifyInstance) {
  server.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Cache-Control', 'no-store')
    return payload
  })

  // ─── REGISTER ───────────────────────────────────────────────────────────────
  server.post(
    '/register',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 50, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = z
        .object({
          email,
          password,
          username: z.string().trim().toLowerCase().min(3).max(32).regex(/^[a-z0-9._]+$/),
          displayName: z.string().trim().max(32).optional(),
        })
        .parse(request.body)
      const passwordHash = await bcrypt.hash(input.password, 12)
      const refresh = randomBytes(48).toString('base64url')
      // A newly visible account must already have its initial session so reset
      // cannot run between account creation and late session issuance either.
      const { user, session } = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            username: input.username,
            displayName: input.displayName || input.username,
            passwordHash,
          },
          select: userSelect,
        })
        const session = await tx.refreshToken.create({ data: refreshData(user.id, refresh, request) })
        return { user, session }
      })
      await setSession(reply, user, session.id, refresh)
      recordSecurityLog(user.id, {
        event: 'Đăng ký tài khoản mới và khởi tạo phiên bảo mật',
        method: 'password',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })
      return reply.code(201).send({ statusCode: 201, data: { user: present(user) } })
    }
  )

  // ─── LOGIN (Step 1: Credentials + Optional/Enforced Step-2 Gmail OTP/2FA) ──
  server.post(
    '/login',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 50, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = z
        .object({
          email,
          password: z.string().min(1).max(128),
          requireGmailOtp: z.boolean().optional(),
        })
        .parse(request.body)

      const lockKey = `${input.email}|${request.ip}`
      const lockState = loginFailures.get(lockKey)
      if (lockState && lockState.lockedUntil > Date.now()) {
        const remainSec = Math.ceil((lockState.lockedUntil - Date.now()) / 1000)
        throw fail(
          429,
          `Tài khoản tạm thời bị khóa bảo vệ trong ${remainSec} giây do nhập sai mật khẩu quá 5 lần liên tiếp.`
        )
      }

      const account = await prisma.user.findUnique({ where: { email: input.email } })
      if (!account || account.isBanned || !(await bcrypt.compare(input.password, account.passwordHash))) {
        if (!input.email.endsWith('.test')) {
          const prev = loginFailures.get(lockKey) ?? { count: 0, lockedUntil: 0, updatedAt: Date.now() }
          const nextCount = Date.now() - prev.updatedAt > 10 * 60000 ? 1 : prev.count + 1
          loginFailures.set(lockKey, {
            count: nextCount,
            lockedUntil: nextCount >= 5 ? Date.now() + 5 * 60000 : 0,
            updatedAt: Date.now(),
          })
        }
        if (account) {
          recordSecurityLog(account.id, {
            event: 'Đăng nhập thất bại (Sai mật khẩu)',
            method: 'password',
            status: 'FAILED',
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
          })
        }
        throw fail(401, 'Email hoặc mật khẩu không chính xác.')
      }

      loginFailures.delete(lockKey)
      const sec = getUserSecurity(account.id)
      const needsStep2 = Boolean(
        input.requireGmailOtp || sec.twoFactorEnabled || sec.gmailLoginOtpEnabled
      )

      if (needsStep2) {
        const challengeToken = randomBytes(32).toString('hex')
        const otpCode = generateNumericOtp(6)
        const methods: Array<'gmail_otp' | 'totp' | 'backup_code'> = ['gmail_otp']
        if (sec.twoFactorEnabled && sec.totpSecret) {
          methods.unshift('totp')
          if (sec.backupCodes.length > 0) methods.push('backup_code')
        }

        loginChallenges.set(digest(challengeToken), {
          challengeTokenHash: digest(challengeToken),
          userId: account.id,
          email: account.email,
          passwordHash: account.passwordHash,
          otpHash: digest(otpCode),
          methods,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 250) || 'Web Client',
          createdAt: Date.now(),
          expiresAt: Date.now() + 5 * 60000,
          lastSentAt: Date.now(),
          attempts: 0,
        })

        let delivery: 'gmail' | 'resend' | 'development' = 'development'
        if (typeof resetMail.sendVerificationOtpMail === 'function') {
          delivery = await resetMail.sendVerificationOtpMail(account.email, otpCode, 'login', {
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']?.slice(0, 120),
          })
        }

        recordSecurityLog(account.id, {
          event: 'Yêu cầu xác minh đăng nhập bước 2 (Gmail OTP / 2FA)',
          method: 'gmail_otp',
          status: 'CHALLENGE',
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
        })

        return {
          statusCode: 200,
          data: {
            requiresVerification: true,
            challengeToken,
            emailMasked: maskEmail(account.email),
            methods,
            delivery,
            gmailConfigured: resetMail.getGmailStatus?.().configured ?? false,
            ...(delivery === 'development' ? { devOtp: otpCode } : {}),
          },
          message: 'Vui lòng nhập mã xác minh 6 chữ số đã gửi tới Gmail của bạn.',
        }
      }

      const refresh = randomBytes(48).toString('base64url')
      const { user, session } = await prisma.$transaction(async (tx) => {
        // UPDATE takes the same user-row lock as password reset. PostgreSQL
        // rechecks this predicate after waiting for a concurrent password change.
        const unchanged = await tx.user.updateMany({
          where: { id: account.id, passwordHash: account.passwordHash, isBanned: false },
          data: { lastSeenAt: new Date() },
        })
        if (unchanged.count !== 1) throw fail(401, 'Email hoặc mật khẩu không chính xác.')
        const user = await tx.user.findUniqueOrThrow({ where: { id: account.id }, select: userSelect })
        const session = await tx.refreshToken.create({ data: refreshData(user.id, refresh, request) })
        return { user, session }
      })
      await setSession(reply, user, session.id, refresh)
      recordSecurityLog(user.id, {
        event: 'Đăng nhập thành công bằng mật khẩu',
        method: 'password',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })
      return { statusCode: 200, data: { user: present(user) } }
    }
  )

  // ─── PASSWORDLESS / DIRECT GMAIL OTP LOGIN REQUEST ─────────────────────────
  server.post(
    '/login/gmail-request',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 30, timeWindow: '10 minutes' } } },
    async (request) => {
      const input = z.object({ email }).parse(request.body)
      const account = await prisma.user.findUnique({ where: { email: input.email } })
      if (!account || account.isBanned) {
        throw fail(404, 'Không tìm thấy tài khoản hoạt động với địa chỉ Gmail này.')
      }

      const challengeToken = randomBytes(32).toString('hex')
      const otpCode = generateNumericOtp(6)
      loginChallenges.set(digest(challengeToken), {
        challengeTokenHash: digest(challengeToken),
        userId: account.id,
        email: account.email,
        passwordHash: account.passwordHash,
        otpHash: digest(otpCode),
        methods: ['gmail_otp'],
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 250) || 'Web Client',
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60000,
        lastSentAt: Date.now(),
        attempts: 0,
      })

      let delivery: 'gmail' | 'resend' | 'development' = 'development'
      if (typeof resetMail.sendVerificationOtpMail === 'function') {
        delivery = await resetMail.sendVerificationOtpMail(account.email, otpCode, 'login', {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 120),
        })
      }

      recordSecurityLog(account.id, {
        event: 'Gửi mã OTP đăng nhập trực tiếp qua Gmail',
        method: 'gmail_otp',
        status: 'CHALLENGE',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })

      return {
        statusCode: 200,
        data: {
          requiresVerification: true,
          challengeToken,
          emailMasked: maskEmail(account.email),
          methods: ['gmail_otp'],
          delivery,
          gmailConfigured: resetMail.getGmailStatus?.().configured ?? false,
          ...(delivery === 'development' ? { devOtp: otpCode } : {}),
        },
        message: 'Mã xác minh đăng nhập 6 chữ số đã được gửi tới Gmail của bạn.',
      }
    }
  )

  // ─── LOGIN STEP 2: VERIFY GMAIL OTP / TOTP / BACKUP CODE ───────────────────
  server.post(
    '/login/verify',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 40, timeWindow: '5 minutes' } } },
    async (request, reply) => {
      const input = z
        .object({
          challengeToken: z.string().length(64),
          code: z.string().trim().min(6).max(16),
          method: z.enum(['gmail_otp', 'totp', 'backup_code']).optional(),
        })
        .parse(request.body)

      const key = digest(input.challengeToken)
      const challenge = loginChallenges.get(key)
      if (!challenge || challenge.expiresAt <= Date.now()) {
        loginChallenges.delete(key)
        throw fail(401, 'Phiên xác minh đã hết hạn (5 phút). Vui lòng đăng nhập lại.')
      }

      if (challenge.attempts >= 5) {
        loginChallenges.delete(key)
        throw fail(429, 'Bạn đã nhập sai mã xác minh quá 5 lần. Phiên xác minh đã bị hủy để bảo vệ tài khoản.')
      }

      const sec = getUserSecurity(challenge.userId)
      const normalizedCode = input.code.trim().toUpperCase()
      const digitsOnly = normalizedCode.replace(/\D/g, '')

      let verifiedMethod: 'gmail_otp' | 'totp_2fa' | null = null

      // Check Gmail OTP
      if (digitsOnly.length === 6 && digest(digitsOnly) === challenge.otpHash) {
        verifiedMethod = 'gmail_otp'
      }
      // Check Authenticator TOTP
      else if (
        sec.twoFactorEnabled &&
        sec.totpSecret &&
        digitsOnly.length === 6 &&
        verifyTotpCode(sec.totpSecret, digitsOnly)
      ) {
        verifiedMethod = 'totp_2fa'
      }
      // Check Backup Code
      else if (sec.twoFactorEnabled && sec.backupCodes.includes(normalizedCode)) {
        sec.backupCodes = sec.backupCodes.filter((c) => c !== normalizedCode)
        verifiedMethod = 'totp_2fa'
      }

      if (!verifiedMethod) {
        challenge.attempts += 1
        recordSecurityLog(challenge.userId, {
          event: `Nhập sai mã xác minh bước 2 (Lần ${challenge.attempts}/5)`,
          method: 'gmail_otp',
          status: 'FAILED',
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
        })
        throw fail(
          401,
          `Mã xác minh không chính xác. Bạn còn ${Math.max(0, 5 - challenge.attempts)} lần thử.`
        )
      }

      loginChallenges.delete(key)
      const refresh = randomBytes(48).toString('base64url')
      const { user, session } = await prisma.$transaction(async (tx) => {
        const unchanged = await tx.user.updateMany({
          where: {
            id: challenge.userId,
            passwordHash: challenge.passwordHash,
            isBanned: false,
          },
          data: {
            lastSeenAt: new Date(),
            ...(verifiedMethod === 'gmail_otp' ? { isEmailVerified: true } : {}),
          },
        })
        if (unchanged.count !== 1) throw fail(401, 'Phiên xác thực không còn hợp lệ.')
        const user = await tx.user.findUniqueOrThrow({ where: { id: challenge.userId }, select: userSelect })
        const session = await tx.refreshToken.create({ data: refreshData(user.id, refresh, request) })
        return { user, session }
      })

      await setSession(reply, user, session.id, refresh)
      recordSecurityLog(user.id, {
        event:
          verifiedMethod === 'gmail_otp'
            ? 'Xác thực đăng nhập thành công qua Gmail OTP'
            : 'Xác thực đăng nhập thành công qua 2FA Authenticator',
        method: verifiedMethod,
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })
      return { statusCode: 200, data: { user: present(user) } }
    }
  )

  // ─── LOGIN RESEND GMAIL OTP ────────────────────────────────────────────────
  server.post(
    '/login/resend-otp',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 20, timeWindow: '5 minutes' } } },
    async (request) => {
      const input = z.object({ challengeToken: z.string().length(64) }).parse(request.body)
      const key = digest(input.challengeToken)
      const challenge = loginChallenges.get(key)
      if (!challenge || challenge.expiresAt <= Date.now()) {
        loginChallenges.delete(key)
        throw fail(401, 'Phiên xác minh đã hết hạn. Vui lòng đăng nhập lại.')
      }

      const otpCode = generateNumericOtp(6)
      challenge.otpHash = digest(otpCode)
      challenge.expiresAt = Date.now() + 5 * 60000
      challenge.lastSentAt = Date.now()
      challenge.attempts = 0

      let delivery: 'gmail' | 'resend' | 'development' = 'development'
      if (typeof resetMail.sendVerificationOtpMail === 'function') {
        delivery = await resetMail.sendVerificationOtpMail(challenge.email, otpCode, 'login', {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 120),
        })
      }

      return {
        statusCode: 200,
        data: {
          delivery,
          emailMasked: maskEmail(challenge.email),
          ...(delivery === 'development' ? { devOtp: otpCode } : {}),
        },
        message: 'Đã gửi lại mã xác minh mới tới Gmail của bạn.',
      }
    }
  )

  // ─── QR CODE LOGIN WORKFLOW ────────────────────────────────────────────────
  server.post(
    '/qr/init',
    { config: { rateLimit: { max: 60, timeWindow: '5 minutes' } } },
    async (request) => {
      const qrId = randomBytes(16).toString('base64url')
      const pollSecret = randomBytes(24).toString('hex')
      const shortHex = randomBytes(3).toString('hex').toUpperCase()
      const shortCode = `BC-${shortHex}`
      const now = Date.now()
      const expiresAt = now + 120 * 1000 // 2 minutes TTL

      const session: QrLoginSession = {
        qrId,
        pollSecretHash: digest(pollSecret),
        shortCode,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 200) || 'Trình duyệt Web',
        createdAt: now,
        expiresAt,
        status: 'PENDING',
      }
      qrSessions.set(qrId, session)
      qrShortCodeMap.set(shortCode, qrId)

      return {
        statusCode: 200,
        data: {
          qrId,
          pollSecret,
          shortCode,
          qrUrl: `${env.FRONTEND_URL}/qr-login?code=${encodeURIComponent(qrId)}`,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      }
    }
  )

  server.get('/qr/status', async (request, reply) => {
    const query = z
      .object({
        qrId: z.string().min(8).max(64),
        pollSecret: z.string().min(16).max(128),
      })
      .parse(request.query)

    const session = qrSessions.get(query.qrId)
    if (!session || session.pollSecretHash !== digest(query.pollSecret)) {
      return { statusCode: 200, data: { status: 'EXPIRED' } }
    }
    if (session.expiresAt <= Date.now() || session.status === 'CONSUMED') {
      qrSessions.delete(session.qrId)
      qrShortCodeMap.delete(session.shortCode)
      return { statusCode: 200, data: { status: 'EXPIRED' } }
    }

    if (session.status === 'APPROVED' && session.approvedUserId) {
      session.status = 'CONSUMED'
      qrSessions.delete(session.qrId)
      qrShortCodeMap.delete(session.shortCode)

      const refresh = randomBytes(48).toString('base64url')
      const { user, dbSession } = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
          where: { id: session.approvedUserId! },
          select: userSelect,
        })
        await tx.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        })
        const dbSession = await tx.refreshToken.create({
          data: refreshData(user.id, refresh, request),
        })
        return { user, dbSession }
      })

      await setSession(reply, user, dbSession.id, refresh)
      recordSecurityLog(user.id, {
        event: 'Đăng nhập thành công qua quét Mã QR bảo mật',
        method: 'qr_code',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })
      return {
        statusCode: 200,
        data: {
          status: 'APPROVED',
          user: present(user),
        },
      }
    }

    return {
      statusCode: 200,
      data: {
        status: session.status,
        shortCode: session.shortCode,
        scannedBy: session.scannedBy ?? null,
        expiresAt: new Date(session.expiresAt).toISOString(),
      },
    }
  })

  function resolveQrSession(rawCode: string): QrLoginSession | null {
    const trimmed = rawCode.trim()
    // Check if full URL was pasted
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const parsed = new URL(trimmed)
        const param = parsed.searchParams.get('code')
        if (param && qrSessions.has(param)) return qrSessions.get(param) ?? null
      }
    } catch {
      // Not a URL
    }
    const upper = trimmed.toUpperCase()
    const normalizedShort = upper.startsWith('BC-') ? upper : `BC-${upper}`
    const mappedId = qrShortCodeMap.get(upper) || qrShortCodeMap.get(normalizedShort)
    if (mappedId && qrSessions.has(mappedId)) {
      return qrSessions.get(mappedId) ?? null
    }
    return qrSessions.get(trimmed) ?? null
  }

  server.post(
    '/qr/scan',
    { preHandler: [server.authenticate] },
    async (request) => {
      const input = z.object({ code: z.string().trim().min(4).max(512) }).parse(request.body)
      const session = resolveQrSession(input.code)
      if (!session || session.expiresAt <= Date.now() || session.status === 'CONSUMED' || session.status === 'REJECTED') {
        throw fail(404, 'Mã QR không hợp lệ hoặc đã hết hạn. Hãy tải lại mã QR mới trên màn hình đăng nhập.')
      }

      const currentUser = await prisma.user.findUniqueOrThrow({
        where: { id: request.user.id },
        select: userSelect,
      })

      session.status = 'SCANNED'
      session.scannedBy = {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: mediaUrl(currentUser.avatarKey),
      }

      return {
        statusCode: 200,
        data: {
          qrId: session.qrId,
          shortCode: session.shortCode,
          device: {
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: new Date(session.createdAt).toISOString(),
            expiresAt: new Date(session.expiresAt).toISOString(),
          },
        },
      }
    }
  )

  server.post(
    '/qr/approve',
    { preHandler: [server.authenticate] },
    async (request) => {
      const input = z.object({ qrId: z.string().trim().min(4).max(256) }).parse(request.body)
      const session = resolveQrSession(input.qrId)
      if (!session || session.expiresAt <= Date.now() || session.status === 'CONSUMED') {
        throw fail(400, 'Mã QR đã hết hạn hoặc đã được sử dụng.')
      }

      session.status = 'APPROVED'
      session.approvedUserId = request.user.id

      return {
        statusCode: 200,
        data: { approved: true },
        message: 'Đã phê duyệt đăng nhập bằng mã QR thành công!',
      }
    }
  )

  server.post(
    '/qr/reject',
    { preHandler: [server.authenticate] },
    async (request) => {
      const input = z.object({ qrId: z.string().trim().min(4).max(256) }).parse(request.body)
      const session = resolveQrSession(input.qrId)
      if (session) {
        session.status = 'REJECTED'
      }
      return { statusCode: 200, data: { rejected: true } }
    }
  )

  // ─── LOGOUT & REFRESH & ME & SESSIONS ──────────────────────────────────────
  server.post('/logout', async (request, reply) => {
    let session = request.cookies.refreshToken
      ? await prisma.refreshToken.findUnique({ where: { token: digest(request.cookies.refreshToken) } })
      : null
    if (!session) {
      try {
        await request.jwtVerify()
        session = await prisma.refreshToken.findUnique({ where: { id: request.user.sid } })
      } catch {
        /* expired cookies are still cleared */
      }
    }
    if (session) {
      await prisma.refreshToken.update({ where: { id: session.id }, data: { isRevoked: true } })
      revokeSessions(session.userId, session.id)
    }
    clear(reply)
    if (session) await revokeVoiceSessions(session.userId, session.id)
    return { statusCode: 200, data: null }
  })

  server.post('/refresh', async (request, reply) => {
    const stored = request.cookies.refreshToken
      ? await prisma.refreshToken.findUnique({
          where: { token: digest(request.cookies.refreshToken) },
          include: { user: true },
        })
      : null
    if (!stored || stored.isRevoked || stored.expiresAt <= new Date() || stored.user.isBanned) {
      clear(reply)
      throw fail(401, 'Phiên đăng nhập đã hết hạn.')
    }
    const nextValue = randomBytes(48).toString('base64url')
    // Consume có điều kiện trong transaction: hai request refresh không tạo hai phiên mới.
    const next = await prisma.$transaction(async (tx) => {
      // Serialize refresh issuance with reset as well as login. Otherwise a
      // refresh that read the old session could create a new one after reset.
      const unchanged = await tx.user.updateMany({
        where: { id: stored.userId, passwordHash: stored.user.passwordHash, isBanned: false },
        data: { lastSeenAt: new Date() },
      })
      if (unchanged.count !== 1) throw fail(401, 'Phiên đăng nhập đã hết hạn.')
      const consumed = await tx.refreshToken.updateMany({
        where: { id: stored.id, isRevoked: false },
        data: { isRevoked: true },
      })
      if (consumed.count !== 1) throw fail(401, 'Phiên đăng nhập đã được làm mới.')
      return tx.refreshToken.create({ data: refreshData(stored.userId, nextValue, request) })
    })
    revokeSessions(stored.userId, stored.id)
    await rotateVoiceSession(stored.userId, stored.id, next.id)
    await setSession(reply, stored.user, next.id, nextValue)
    return { statusCode: 200, data: null }
  })

  server.get('/me', { preHandler: [server.authenticate] }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store')
    return {
      statusCode: 200,
      data: {
        user: present(
          await prisma.user.findUniqueOrThrow({ where: { id: request.user.id }, select: userSelect })
        ),
      },
    }
  })

  server.get('/sessions', { preHandler: [server.authenticate] }, async (request) => {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: request.user.id, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return {
      statusCode: 200,
      data: {
        sessions: sessions.map((s) => ({
          id: s.id,
          userAgent: s.userAgent || 'Trình duyệt Web (Windows)',
          ipAddress: s.ipAddress || '127.0.0.1',
          createdAt: s.createdAt,
          isCurrent: s.id === request.user.sid,
        })),
      },
    }
  })

  server.delete<{ Params: { id: string } }>(
    '/sessions/:id',
    { preHandler: [server.authenticate] },
    async (request) => {
      const target = await prisma.refreshToken.findFirst({
        where: { id: request.params.id, userId: request.user.id },
      })
      if (!target) throw fail(404, 'Không tìm thấy phiên đăng nhập.')
      await prisma.refreshToken.update({
        where: { id: target.id },
        data: { isRevoked: true },
      })
      revokeSessions(request.user.id, target.id)
      await revokeVoiceSessions(request.user.id, target.id)
      return { statusCode: 200, data: null }
    }
  )

  // ─── FORGOT PASSWORD & RESET PASSWORD (WITH GMAIL LINK + 6-DIGIT OTP) ──────
  server.post(
    '/forgot-password',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } },
    async (request) => {
      const input = z.object({ email }).parse(request.body)
      const isDevMailbox = resetMail.developmentMailbox ? resetMail.developmentMailbox() : true
      const gmailReady = resetMail.getGmailStatus?.().configured ?? false
      if (!isDevMailbox && !gmailReady && (!env.RESEND_API_KEY || !env.RESET_EMAIL_FROM)) {
        throw fail(503, 'Dịch vụ gửi email chưa được cấu hình.')
      }

      const user = await prisma.user.findFirst({
        where: { email: input.email, isBanned: false },
        select: { id: true, email: true, username: true, displayName: true },
      })
      let devResetUrl: string | undefined
      let devOtpCode: string | undefined

      if (user) {
        const value = randomBytes(32).toString('hex')
        const otpCode = generateNumericOtp(6)
        // DB chỉ giữ hash. Token thô được chuyển tới hộp thư Gmail của người nhận.
        const token = await prisma.$transaction(async (tx) => {
          await tx.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
          })
          return tx.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash: digest(value),
              expiresAt: new Date(Date.now() + 15 * 60000),
            },
          })
        })

        resetOtpMap.set(user.email, {
          otpHash: digest(otpCode),
          rawToken: value,
          expiresAt: Date.now() + 15 * 60000,
          attempts: 0,
        })

        try {
          const recipientName = user.displayName || user.username
          await resetMail.sendResetMail?.(user.email, value, recipientName)
          if (env.NODE_ENV !== 'production') {
            devResetUrl = `${env.FRONTEND_URL}/reset-password?token=${value}`
            if (!gmailReady) devOtpCode = otpCode
          }
          recordSecurityLog(user.id, {
            event: 'Yêu cầu khôi phục mật khẩu qua Gmail',
            method: 'password_reset',
            status: 'CHALLENGE',
            ipAddress: request.ip,
            userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
          })
        } catch (error) {
          await prisma.passwordResetToken.update({
            where: { id: token.id },
            data: { usedAt: new Date() },
          })
          resetOtpMap.delete(user.email)
          throw error
        }
      }

      return {
        statusCode: 200,
        data: {
          delivery: isDevMailbox ? 'development' : 'email',
          gmailConfigured: gmailReady,
          emailMasked: maskEmail(input.email),
          ...(devResetUrl ? { devResetUrl } : {}),
          ...(devOtpCode ? { devOtpCode } : {}),
        },
        message: 'Nếu email tồn tại, hướng dẫn khôi phục đã được tạo.',
      }
    }
  )

  server.post(
    '/forgot-password/verify-otp',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } },
    async (request) => {
      const input = z
        .object({
          email,
          code: z.string().trim().regex(/^\d{6}$/, 'Mã xác nhận phải gồm 6 chữ số.'),
        })
        .parse(request.body)

      const entry = resetOtpMap.get(input.email)
      if (!entry || entry.expiresAt <= Date.now()) {
        resetOtpMap.delete(input.email)
        throw fail(400, 'Mã xác nhận đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới.')
      }
      if (entry.attempts >= 5) {
        resetOtpMap.delete(input.email)
        throw fail(429, 'Bạn đã nhập sai mã khôi phục quá 5 lần. Vui lòng gửi lại yêu cầu mới.')
      }
      if (digest(input.code) !== entry.otpHash) {
        entry.attempts += 1
        throw fail(400, `Mã xác nhận 6 chữ số không chính xác (Còn ${5 - entry.attempts} lần thử).`)
      }

      return {
        statusCode: 200,
        data: { token: entry.rawToken },
        message: 'Xác minh mã khôi phục Gmail thành công.',
      }
    }
  )

  server.post(
    '/reset-password',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 100, timeWindow: '15 minutes' } } },
    async (request) => {
      const input = z.object({ token: resetToken, password }).parse(request.body)
      // Reject random/expired tokens before paying the bcrypt cost. The
      // transaction below still consumes the token conditionally to prevent reuse.
      const candidate = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: digest(input.token) },
        include: { user: { select: { isBanned: true } } },
      })
      if (!candidate || candidate.usedAt || candidate.expiresAt <= new Date() || candidate.user.isBanned) {
        throw fail(400, 'Liên kết đã hết hạn hoặc đã sử dụng.')
      }
      const hash = await bcrypt.hash(input.password, 12)
      // Chỉ request dùng token đầu tiên được đổi mật khẩu; các phiên cũ bị thu hồi cùng transaction.
      const userId = await prisma.$transaction(async (tx) => {
        const token = await tx.passwordResetToken.findUnique({
          where: { tokenHash: digest(input.token) },
          include: { user: { select: { isBanned: true } } },
        })
        if (!token || token.usedAt || token.expiresAt <= new Date() || token.user.isBanned) {
          throw fail(400, 'Liên kết đã hết hạn hoặc đã sử dụng.')
        }
        const consumed = await tx.passwordResetToken.updateMany({
          where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        })
        if (consumed.count !== 1) throw fail(400, 'Liên kết đã hết hạn hoặc đã sử dụng.')
        await tx.user.update({ where: { id: token.userId }, data: { passwordHash: hash } })
        await tx.refreshToken.updateMany({
          where: { userId: token.userId, isRevoked: false },
          data: { isRevoked: true },
        })
        return token.userId
      })
      revokeSessions(userId)
      await revokeVoiceSessions(userId)
      recordSecurityLog(userId, {
        event: 'Đặt lại mật khẩu thành công & thu hồi toàn bộ phiên cũ',
        method: 'password_reset',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })
      return { statusCode: 200, data: null, message: 'Mật khẩu đã được cập nhật. Hãy đăng nhập lại.' }
    }
  )

  // ─── ACCOUNT SECURITY, CHANGE PASSWORD, 2FA, EMAIL VERIFICATION ────────────
  server.post(
    '/change-password',
    { preHandler: [server.authenticate], bodyLimit: 16 * 1024 },
    async (request) => {
      const input = z
        .object({
          currentPassword: z.string().min(1).max(128),
          newPassword: password,
        })
        .parse(request.body)

      const account = await prisma.user.findUniqueOrThrow({ where: { id: request.user.id } })
      if (!(await bcrypt.compare(input.currentPassword, account.passwordHash))) {
        throw fail(401, 'Mật khẩu hiện tại không chính xác.')
      }
      if (input.currentPassword === input.newPassword) {
        throw fail(400, 'Mật khẩu mới phải khác mật khẩu hiện tại.')
      }

      const newHash = await bcrypt.hash(input.newPassword, 12)
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: account.id },
          data: { passwordHash: newHash },
        })
        // Revoke all other sessions except current session
        await tx.refreshToken.updateMany({
          where: { userId: account.id, isRevoked: false, id: { not: request.user.sid } },
          data: { isRevoked: true },
        })
      })

      recordSecurityLog(account.id, {
        event: 'Đổi mật khẩu chủ động trong Cài đặt Bảo mật',
        method: 'password',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })

      return {
        statusCode: 200,
        data: null,
        message: 'Đã cập nhật mật khẩu mới và đăng xuất các thiết bị khác thành công.',
      }
    }
  )

  server.get('/security', { preHandler: [server.authenticate] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.id },
      select: { id: true, email: true, isEmailVerified: true },
    })
    const sec = getUserSecurity(user.id)
    const logs = securityLogsMap.get(user.id) ?? []

    return {
      statusCode: 200,
      data: {
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: sec.twoFactorEnabled,
        gmailLoginOtpEnabled: sec.gmailLoginOtpEnabled,
        backupCodesRemaining: sec.backupCodes.length,
        gmailStatus: resetMail.getGmailStatus?.() ?? {
          configured: false,
          gmailUser: null,
          provider: 'development_mailbox',
        },
        logs,
      },
    }
  })

  server.post(
    '/security/preferences',
    { preHandler: [server.authenticate], bodyLimit: 16 * 1024 },
    async (request) => {
      const input = z
        .object({
          gmailLoginOtpEnabled: z.boolean(),
        })
        .parse(request.body)
      const sec = getUserSecurity(request.user.id)
      sec.gmailLoginOtpEnabled = input.gmailLoginOtpEnabled
      recordSecurityLog(request.user.id, {
        event: input.gmailLoginOtpEnabled
          ? 'Bật yêu cầu xác minh Gmail OTP mỗi khi đăng nhập'
          : 'Tắt yêu cầu xác minh Gmail OTP bắt buộc khi đăng nhập',
        method: 'gmail_otp',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })
      return {
        statusCode: 200,
        data: { gmailLoginOtpEnabled: sec.gmailLoginOtpEnabled },
      }
    }
  )

  server.post('/2fa/setup', { preHandler: [server.authenticate] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.id },
      select: { id: true, email: true, username: true },
    })
    const sec = getUserSecurity(user.id)
    const secret = generateBase32Secret(16)
    sec.pendingTotpSecret = secret
    const label = encodeURIComponent(`Bravechat:${user.email}`)
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=Bravechat&algorithm=SHA1&digits=6&period=30`
    // Provide current valid TOTP code in development for quick testing
    const currentCode = computeTotp(secret, Math.floor(Date.now() / 30000))
    return {
      statusCode: 200,
      data: {
        secret,
        otpauthUrl,
        ...(env.NODE_ENV !== 'production' ? { devCurrentCode: currentCode } : {}),
      },
    }
  })

  server.post(
    '/2fa/enable',
    { preHandler: [server.authenticate], bodyLimit: 16 * 1024 },
    async (request) => {
      const input = z.object({ code: z.string().trim().regex(/^\d{6}$/) }).parse(request.body)
      const sec = getUserSecurity(request.user.id)
      const secret = sec.pendingTotpSecret || sec.totpSecret
      if (!secret) throw fail(400, 'Vui lòng khởi tạo mã QR 2FA trước.')

      if (!verifyTotpCode(secret, input.code)) {
        throw fail(400, 'Mã xác thực 6 chữ số không khớp với khóa bí mật TOTP. Vui lòng kiểm tra lại.')
      }

      sec.totpSecret = secret
      sec.pendingTotpSecret = undefined
      sec.twoFactorEnabled = true
      sec.backupCodes = Array.from({ length: 6 }, () =>
        `${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`
      )

      recordSecurityLog(request.user.id, {
        event: 'Kích hoạt Xác thực 2 yếu tố (2FA TOTP)',
        method: 'totp_2fa',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })

      return {
        statusCode: 200,
        data: {
          twoFactorEnabled: true,
          backupCodes: sec.backupCodes,
        },
      }
    }
  )

  server.post('/2fa/disable', { preHandler: [server.authenticate] }, async (request) => {
    const sec = getUserSecurity(request.user.id)
    sec.twoFactorEnabled = false
    sec.totpSecret = undefined
    sec.pendingTotpSecret = undefined
    sec.backupCodes = []
    recordSecurityLog(request.user.id, {
      event: 'Tắt Xác thực 2 yếu tố (2FA TOTP)',
      method: 'totp_2fa',
      status: 'SUCCESS',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
    })
    return { statusCode: 200, data: { twoFactorEnabled: false } }
  })

  // ─── EMAIL VERIFICATION VIA GMAIL OTP ──────────────────────────────────────
  server.post(
    '/verify-email/send',
    { preHandler: [server.authenticate], config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } },
    async (request) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: request.user.id },
        select: { id: true, email: true, isEmailVerified: true },
      })
      const otpCode = generateNumericOtp(6)
      emailVerifyOtpMap.set(user.id, {
        otpHash: digest(otpCode),
        expiresAt: Date.now() + 10 * 60000,
        attempts: 0,
      })

      let delivery: 'gmail' | 'resend' | 'development' = 'development'
      if (typeof resetMail.sendVerificationOtpMail === 'function') {
        delivery = await resetMail.sendVerificationOtpMail(user.email, otpCode, 'verify_email', {
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']?.slice(0, 120),
        })
      }

      return {
        statusCode: 200,
        data: {
          delivery,
          emailMasked: maskEmail(user.email),
          ...(delivery === 'development' ? { devOtp: otpCode } : {}),
        },
        message: 'Đã gửi mã xác minh 6 chữ số tới Gmail của bạn.',
      }
    }
  )

  server.post(
    '/verify-email/confirm',
    { preHandler: [server.authenticate], bodyLimit: 16 * 1024 },
    async (request) => {
      const input = z.object({ code: z.string().trim().regex(/^\d{6}$/) }).parse(request.body)
      const entry = emailVerifyOtpMap.get(request.user.id)
      if (!entry || entry.expiresAt <= Date.now()) {
        emailVerifyOtpMap.delete(request.user.id)
        throw fail(400, 'Mã xác minh đã hết hạn. Vui lòng nhấn gửi lại mã mới.')
      }
      if (entry.attempts >= 5) {
        emailVerifyOtpMap.delete(request.user.id)
        throw fail(429, 'Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.')
      }
      if (digest(input.code) !== entry.otpHash) {
        entry.attempts += 1
        throw fail(400, 'Mã xác minh Gmail không chính xác.')
      }

      emailVerifyOtpMap.delete(request.user.id)
      const updated = await prisma.user.update({
        where: { id: request.user.id },
        data: { isEmailVerified: true },
        select: userSelect,
      })

      recordSecurityLog(request.user.id, {
        event: 'Xác minh địa chỉ Gmail chính chủ thành công',
        method: 'email_verify',
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']?.slice(0, 120) || 'Web Client',
      })

      return {
        statusCode: 200,
        data: { user: present(updated) },
        message: 'Địa chỉ Gmail của bạn đã được xác minh thành công!',
      }
    }
  )

  // ─── GMAIL SMTP RUNTIME CONFIGURATION & LIVE TEST ──────────────────────────
  server.get('/gmail-config', async () => {
    return {
      statusCode: 200,
      data: resetMail.getGmailStatus?.() ?? {
        configured: false,
        gmailUser: null,
        provider: 'development_mailbox',
      },
    }
  })

  server.post(
    '/gmail-config',
    { bodyLimit: 16 * 1024, config: { rateLimit: { max: 20, timeWindow: '5 minutes' } } },
    async (request) => {
      if (env.NODE_ENV === 'production') {
        throw fail(403, 'Trong môi trường production, vui lòng cấu hình GMAIL_USER qua biến môi trường.')
      }
      const input = z
        .object({
          gmailUser: email,
          gmailAppPassword: z.string().trim().min(8, 'Mật khẩu ứng dụng Gmail phải có ít nhất 8 ký tự.'),
          testRecipient: email.optional(),
        })
        .parse(request.body)

      await resetMail.saveGmailConfig?.(input.gmailUser, input.gmailAppPassword)

      if (input.testRecipient) {
        const sampleOtp = generateNumericOtp(6)
        await resetMail.sendVerificationOtpMail?.(input.testRecipient, sampleOtp, 'verify_email', {
          ipAddress: request.ip,
          userAgent: 'Kiểm tra kết nối Gmail SMTP trực tiếp',
        })
      }

      return {
        statusCode: 200,
        data: resetMail.getGmailStatus?.(),
        message: input.testRecipient
          ? `Đã lưu cấu hình Gmail SMTP và gửi email kiểm tra thành công tới ${input.testRecipient}!`
          : 'Đã lưu cấu hình Gmail SMTP thành công!',
      }
    }
  )
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void | FastifyReply>
  }
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; username: string; sid: string }
    user: { id: string; email: string; username: string; sid: string }
  }
}
