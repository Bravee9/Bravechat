/**
 * apps/api/src/routes/auth.routes.ts
 * Authentication routes: register, login, logout, refresh
 * ─────────────────────────────────────────────────────────
 * POST /api/auth/register   — Tạo tài khoản mới
 * POST /api/auth/login      — Đăng nhập, trả về JWT
 * POST /api/auth/logout     — Thu hồi refresh token
 * POST /api/auth/refresh    — Lấy access token mới
 * GET  /api/auth/me         — Lấy thông tin user hiện tại
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../config/prisma'
import { mediaUrl } from '../services/storage.service'

// ─── Validation Schemas ──────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  username: z
    .string()
    .min(3, 'Tên người dùng phải có ít nhất 3 ký tự')
    .max(32, 'Tên người dùng tối đa 32 ký tự')
    .regex(/^[a-z0-9._]+$/, 'Chỉ dùng chữ thường, số, dấu chấm và gạch dưới'),
  displayName: z.string().max(32).optional(),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(128),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ─── Route Handler Types ──────────────────────────────────
type RegisterBody = z.infer<typeof RegisterSchema>
type LoginBody = z.infer<typeof LoginSchema>

const REFRESH_COOKIE = 'refreshToken'
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000
const ACCESS_TTL_SECONDS = 15 * 60
const secureCookie = process.env.NODE_ENV === 'production'
const cookieOptions = { httpOnly: true, secure: secureCookie, sameSite: 'lax' as const, path: '/' }
const digestToken = (token: string) => createHash('sha256').update(token).digest('hex')

async function issueSession(reply: FastifyReply, user: { id: string; email: string; username: string }, request: FastifyRequest) {
  const refresh = randomBytes(48).toString('base64url')
  await prisma.refreshToken.create({ data: {
    userId: user.id,
    token: digestToken(refresh),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    userAgent: request.headers['user-agent']?.slice(0, 500),
    ipAddress: request.ip,
  } })
  const access = await reply.jwtSign(user, { expiresIn: ACCESS_TTL_SECONDS })
  reply.setCookie('token', access, { ...cookieOptions, maxAge: ACCESS_TTL_SECONDS })
  reply.setCookie(REFRESH_COOKIE, refresh, { ...cookieOptions, maxAge: REFRESH_TTL_MS / 1000 })
}

// ─── Routes ──────────────────────────────────────────────
export async function authRoutes(server: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Tạo tài khoản mới
   */
  server.post<{ Body: RegisterBody }>(
    '/register',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
      // Validate input
      const parseResult = RegisterSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parseResult.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ',
          details: parseResult.error.flatten().fieldErrors,
        })
      }

      const { username, password, displayName } = parseResult.data
      const email = parseResult.data.email.toLowerCase()
      const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
      if (existingUser) return reply.status(409).send({ statusCode: 409, message: 'Email hoặc tên người dùng đã tồn tại.' })
      const user = await prisma.user.create({
        data: { email, username, displayName, passwordHash: await bcrypt.hash(password, 12) },
        select: { id: true, email: true, username: true, displayName: true },
      })
      await issueSession(reply, user, request)

      return reply.status(201).send({
        statusCode: 201,
        message: 'Tài khoản đã được tạo thành công.',
        data: {
          user,
        },
      })
    }
  )

  /**
   * POST /api/auth/login
   * Đăng nhập và nhận JWT
   */
  server.post<{ Body: LoginBody }>(
    '/login',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const parseResult = LoginSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: parseResult.error.errors[0]?.message,
        })
      }

      const user = await prisma.user.findUnique({ where: { email: request.body.email.toLowerCase() } })
      if (!user || !(await bcrypt.compare(request.body.password, user.passwordHash)) || user.isBanned) {
        return reply.status(401).send({ statusCode: 401, message: 'Email hoặc mật khẩu không chính xác.' })
      }
      await issueSession(reply, user, request)

      return reply.status(200).send({
        statusCode: 200,
        message: 'Đăng nhập thành công.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
          },
        },
      })
    }
  )

  /**
   * POST /api/auth/logout
   * Thu hồi refresh token
   */
  server.post(
    '/logout',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const refresh = request.cookies?.[REFRESH_COOKIE]
      if (refresh) await prisma.refreshToken.updateMany({ where: { token: digestToken(refresh), isRevoked: false }, data: { isRevoked: true } })
      reply.clearCookie('token', { path: '/' })
      reply.clearCookie(REFRESH_COOKIE, { path: '/' })
      return reply.send({ statusCode: 200, message: 'Đã đăng xuất.' })
    }
  )

  /**
   * POST /api/auth/refresh
   * Đổi refresh token lấy access token mới
   */
  server.post(
    '/refresh',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const refresh = request.cookies?.[REFRESH_COOKIE]
      if (!refresh) return reply.status(401).send({ statusCode: 401, message: 'Phiên đăng nhập đã hết hạn.' })
      const tokenHash = digestToken(refresh)
      const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash }, include: { user: true } })
      if (!stored || stored.isRevoked || stored.expiresAt <= new Date() || stored.user.isBanned) {
        reply.clearCookie('token', { path: '/' })
        reply.clearCookie(REFRESH_COOKIE, { path: '/' })
        return reply.status(401).send({ statusCode: 401, message: 'Phiên đăng nhập đã hết hạn.' })
      }
      const nextRefresh = randomBytes(48).toString('base64url')
      const nextHash = digestToken(nextRefresh)
      await prisma.$transaction([
        prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } }),
        prisma.refreshToken.create({ data: { userId: stored.userId, token: nextHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS), userAgent: request.headers['user-agent']?.slice(0, 500), ipAddress: request.ip } }),
      ])
      const access = await reply.jwtSign({ id: stored.user.id, email: stored.user.email, username: stored.user.username }, { expiresIn: ACCESS_TTL_SECONDS })
      reply.setCookie('token', access, { ...cookieOptions, maxAge: ACCESS_TTL_SECONDS })
      reply.setCookie(REFRESH_COOKIE, nextRefresh, { ...cookieOptions, maxAge: REFRESH_TTL_MS / 1000 })
      return reply.send({ statusCode: 200, message: 'Phiên đăng nhập đã được gia hạn.' })
    }
  )

  /**
   * GET /api/auth/me
   * Lấy thông tin người dùng hiện tại
   */
  server.get(
    '/me',
    { preHandler: [server.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await prisma.user.findUnique({ where: { id: request.user.id }, select: { id: true, username: true, displayName: true, email: true, avatarKey: true, status: true, customStatus: true, discriminator: true, bio: true } })
      if (!user) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy người dùng.' })
      return reply.send({
        statusCode: 200,
        data: { user: { ...user, avatarUrl: mediaUrl(user.avatarKey) } },
      })
    }
  )
}

// Extend FastifyInstance với custom authenticate và JWT types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
      username: string
    }
    user: {
      id: string
      email: string
      username: string
    }
  }
}

