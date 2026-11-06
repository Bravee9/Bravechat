import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import { mediaUrl } from '../services/storage.service'
import { fail } from '../services/conversation'
import { developmentMailbox, sendResetMail } from '../services/reset-mail'
import { revokeSessions } from './websocket.routes'

const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const email = z.string().trim().toLowerCase().email('Email không hợp lệ.')
const password = z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.').max(128).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu tối đa 72 byte UTF-8.')
const userSelect = { id: true, email: true, username: true, displayName: true, discriminator: true, status: true, customStatus: true, bio: true, avatarKey: true, bannerKey: true } as const
const present = (user: any) => ({ ...user, avatarUrl: mediaUrl(user.avatarKey), bannerUrl: mediaUrl(user.bannerKey) })
const options = { httpOnly: true, secure: env.FRONTEND_URL.startsWith('https:'), sameSite: 'lax' as const, path: '/' }
const refreshData = (userId: string, value: string, request: FastifyRequest) => ({ userId, token: digest(value), expiresAt: new Date(Date.now() + 30 * 86400000), userAgent: request.headers['user-agent']?.slice(0, 500), ipAddress: request.ip })
async function setSession(reply: FastifyReply, user: { id: string; email: string; username: string }, sid: string, refresh: string) {
  // JWT trỏ tới phiên trong DB: logout/reset có thể thu hồi ngay cả JWT còn hạn.
  const access = await reply.jwtSign({ id: user.id, email: user.email, username: user.username, sid }, { expiresIn: 900 })
  reply.setCookie('token', access, { ...options, maxAge: 900 })
  reply.setCookie('refreshToken', refresh, { ...options, maxAge: 30 * 86400 })
}
async function issue(reply: FastifyReply, user: { id: string; email: string; username: string }, request: FastifyRequest) {
  const refresh = randomBytes(48).toString('base64url')
  const session = await prisma.refreshToken.create({ data: refreshData(user.id, refresh, request) })
  await setSession(reply, user, session.id, refresh)
}
function clear(reply: FastifyReply) { reply.clearCookie('token', options); reply.clearCookie('refreshToken', options); reply.clearCookie('refresh', options) }
export async function authRoutes(server: FastifyInstance) {
  server.addHook('onSend', async (_request, reply, payload) => {
    reply.header('Cache-Control', 'no-store')
    return payload
  })
  server.post('/register', { config: { rateLimit: { max: 50, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = z.object({ email, password, username: z.string().trim().toLowerCase().min(3).max(32).regex(/^[a-z0-9._]+$/), displayName: z.string().trim().max(32).optional() }).parse(request.body)
    const user = await prisma.user.create({ data: { email: input.email, username: input.username, displayName: input.displayName || input.username, passwordHash: await bcrypt.hash(input.password, 12) }, select: userSelect })
    await issue(reply, user, request)
    return reply.code(201).send({ statusCode: 201, data: { user: present(user) } })
  })
  server.post('/login', { config: { rateLimit: { max: 50, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = z.object({ email, password: z.string().min(1).max(128) }).parse(request.body)
    const account = await prisma.user.findUnique({ where: { email: input.email } })
    if (!account || account.isBanned || !await bcrypt.compare(input.password, account.passwordHash)) throw fail(401, 'Email hoặc mật khẩu không chính xác.')
    const refresh = randomBytes(48).toString('base64url')
    const { user, session } = await prisma.$transaction(async (tx) => {
      // UPDATE takes the same user-row lock as password reset. PostgreSQL
      // rechecks this predicate after waiting for a concurrent password change.
      const unchanged = await tx.user.updateMany({ where: { id: account.id, passwordHash: account.passwordHash, isBanned: false }, data: { lastSeenAt: new Date() } })
      if (unchanged.count !== 1) throw fail(401, 'Email hoặc mật khẩu không chính xác.')
      const user = await tx.user.findUniqueOrThrow({ where: { id: account.id }, select: userSelect })
      const session = await tx.refreshToken.create({ data: refreshData(user.id, refresh, request) })
      return { user, session }
    })
    await setSession(reply, user, session.id, refresh)
    return { statusCode: 200, data: { user: present(user) } }
  })
  server.post('/logout', async (request, reply) => {
    let session = request.cookies.refreshToken ? await prisma.refreshToken.findUnique({ where: { token: digest(request.cookies.refreshToken) } }) : null
    if (!session) { try { await request.jwtVerify(); session = await prisma.refreshToken.findUnique({ where: { id: request.user.sid } }) } catch { /* expired cookies are still cleared */ } }
    if (session) { await prisma.refreshToken.update({ where: { id: session.id }, data: { isRevoked: true } }); revokeSessions(session.userId, session.id) }
    clear(reply)
    return { statusCode: 200, data: null }
  })
  server.post('/refresh', async (request, reply) => {
    const stored = request.cookies.refreshToken ? await prisma.refreshToken.findUnique({ where: { token: digest(request.cookies.refreshToken) }, include: { user: true } }) : null
    if (!stored || stored.isRevoked || stored.expiresAt <= new Date() || stored.user.isBanned) { clear(reply); throw fail(401, 'Phiên đăng nhập đã hết hạn.') }
    const nextValue = randomBytes(48).toString('base64url')
    // Consume có điều kiện trong transaction: hai request refresh không tạo hai phiên mới.
    const next = await prisma.$transaction(async (tx) => {
      // Serialize refresh issuance with reset as well as login. Otherwise a
      // refresh that read the old session could create a new one after reset.
      const unchanged = await tx.user.updateMany({ where: { id: stored.userId, passwordHash: stored.user.passwordHash, isBanned: false }, data: { lastSeenAt: new Date() } })
      if (unchanged.count !== 1) throw fail(401, 'Phiên đăng nhập đã hết hạn.')
      const consumed = await tx.refreshToken.updateMany({ where: { id: stored.id, isRevoked: false }, data: { isRevoked: true } })
      if (consumed.count !== 1) throw fail(401, 'Phiên đăng nhập đã được làm mới.')
      return tx.refreshToken.create({ data: refreshData(stored.userId, nextValue, request) })
    })
    await setSession(reply, stored.user, next.id, nextValue)
    revokeSessions(stored.userId, stored.id)
    return { statusCode: 200, data: null }
  })
  server.get('/me', { preHandler: [server.authenticate] }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store')
    return { statusCode: 200, data: { user: present(await prisma.user.findUniqueOrThrow({ where: { id: request.user.id }, select: userSelect })) } }
  })
  server.post('/forgot-password', { config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } }, async (request) => {
    const input = z.object({ email }).parse(request.body)
    if (!developmentMailbox() && (!env.RESEND_API_KEY || !env.RESET_EMAIL_FROM)) throw fail(503, 'Dịch vụ gửi email chưa được cấu hình.')
    const user = await prisma.user.findFirst({ where: { email: input.email, isBanned: false }, select: { id: true, email: true } })
    if (user) {
      const value = randomBytes(32).toString('hex')
      // DB chỉ giữ hash. Token thô chỉ được chuyển tới hộp thư của người nhận.
      const token = await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } })
        return tx.passwordResetToken.create({ data: { userId: user.id, tokenHash: digest(value), expiresAt: new Date(Date.now() + 15 * 60000) } })
      })
      try { await sendResetMail(user.email, value) } catch (error) { await prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }); throw error }
    }
    return { statusCode: 200, data: { delivery: developmentMailbox() ? 'development' : 'email' }, message: 'Nếu email tồn tại, hướng dẫn khôi phục đã được tạo.' }
  })
  server.post('/reset-password', { config: { rateLimit: { max: 100, timeWindow: '15 minutes' } } }, async (request) => {
    const input = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password }).parse(request.body)
    // Reject random/expired tokens before paying the bcrypt cost. The
    // transaction below still consumes the token conditionally to prevent reuse.
    const candidate = await prisma.passwordResetToken.findUnique({ where: { tokenHash: digest(input.token) }, include: { user: { select: { isBanned: true } } } })
    if (!candidate || candidate.usedAt || candidate.expiresAt <= new Date() || candidate.user.isBanned) throw fail(400, 'Liên kết đã hết hạn hoặc đã sử dụng.')
    const hash = await bcrypt.hash(input.password, 12)
    // Chỉ request dùng token đầu tiên được đổi mật khẩu; các phiên cũ bị thu hồi cùng transaction.
    const userId = await prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash: digest(input.token) }, include: { user: { select: { isBanned: true } } } })
      if (!token || token.usedAt || token.expiresAt <= new Date() || token.user.isBanned) throw fail(400, 'Liên kết đã hết hạn hoặc đã sử dụng.')
      const consumed = await tx.passwordResetToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } })
      if (consumed.count !== 1) throw fail(400, 'Liên kết đã hết hạn hoặc đã sử dụng.')
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash: hash } })
      await tx.refreshToken.updateMany({ where: { userId: token.userId, isRevoked: false }, data: { isRevoked: true } })
      return token.userId
    })
    revokeSessions(userId)
    return { statusCode: 200, data: null, message: 'Mật khẩu đã được cập nhật. Hãy đăng nhập lại.' }
  })
}
declare module 'fastify' { interface FastifyInstance { authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void | FastifyReply> } }
declare module '@fastify/jwt' { interface FastifyJWT { payload: { id: string; email: string; username: string; sid: string }; user: { id: string; email: string; username: string; sid: string } } }
