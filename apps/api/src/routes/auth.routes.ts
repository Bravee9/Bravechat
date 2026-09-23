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

      // TODO: Implement in AuthService
      // - Check email/username uniqueness
      // - Hash password with bcrypt
      // - Create user record
      // - Send verification email (Phase 2)
      // - Return created user (without password)

      return reply.status(201).send({
        statusCode: 201,
        message: 'Tài khoản đã được tạo thành công.',
        data: {
          /* user object */
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

      // TODO: Implement in AuthService
      // - Find user by email
      // - Compare password with bcrypt
      // - Generate access token (JWT, 15m)
      // - Generate refresh token (random, store in Redis + DB)
      // - Set refresh token as HttpOnly cookie
      // - Return access token + user info

      return reply.status(200).send({
        statusCode: 200,
        message: 'Đăng nhập thành công.',
        data: {
          accessToken: 'jwt_access_token_here',
          user: {
            /* user object */
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
      // TODO: Implement in AuthService
      // - Get refresh token from HttpOnly cookie
      // - Validate against database + Redis
      // - Issue new access token
      // - Rotate refresh token (invalidate old, create new)

      return reply.send({
        statusCode: 200,
        data: { accessToken: 'new_jwt_access_token' },
      })
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
      // TODO: Return request.user populated by authenticate hook
      return reply.send({
        statusCode: 200,
        data: { user: request.user },
      })
    }
  )
}

// Extend FastifyInstance với custom authenticate
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      username: string
    }
  }
}
