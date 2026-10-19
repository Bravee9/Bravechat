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
import { prisma } from '../config/prisma'

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
      const token = await reply.jwtSign(user)
      reply.setCookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 })

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
      const token = await reply.jwtSign({ id: user.id, email: user.email, username: user.username })
      reply.setCookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 })

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
    { preHandler: [server.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // TODO: Implement in AuthService
      // - Get refresh token from cookie
      // - Revoke in database + Redis blacklist
      // - Clear cookie

      reply.clearCookie('token')
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
      return reply.status(501).send({ statusCode: 501, message: 'Refresh token chưa được cấu hình.' })
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
      const user = await prisma.user.findUnique({ where: { id: request.user.id }, select: { id: true, username: true, displayName: true, email: true, avatarKey: true } })
      if (!user) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy người dùng.' })
      return reply.send({
        statusCode: 200,
        data: { user },
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

