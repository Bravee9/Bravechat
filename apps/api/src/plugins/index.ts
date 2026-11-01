// ============================================================
// apps/api/src/plugins/index.ts
// Register all Fastify plugins
// ============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { env } from '../config/env'
import r2 from './r2'
import { prisma } from '../config/prisma'

export async function registerPlugins(server: FastifyInstance) {
  server.addContentTypeParser('application/webhook+json', { parseAs: 'string' }, (_request, body, done) => done(null, body))
  // CORS — allow frontend origin
  await server.register(cors, {
    origin: [env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // Cookie support
  await server.register(cookie, {
    secret: env.JWT_SECRET,
  })

  // JWT Authentication
  await server.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  })

  server.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ statusCode: 401, message: 'Authentication required' })
    }
    const valid = request.user.sid && await prisma.refreshToken.findFirst({ where: { id: request.user.sid, userId: request.user.id, isRevoked: false, expiresAt: { gt: new Date() }, user: { isBanned: false } }, select: { id: true, user: { select: { username: true, email: true } } } })
    if (!valid) return reply.status(401).send({ statusCode: 401, message: 'Phiên đăng nhập đã hết hạn.' })
    request.user.username = valid.user.username
    request.user.email = valid.user.email
  })
  server.addHook('onRequest', async (request, reply) => {
    if (request.headers.origin && request.headers.origin !== env.FRONTEND_URL && (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || request.headers.upgrade === 'websocket')) return reply.code(403).send({ statusCode: 403, message: 'Origin không được phép.' })
  })

  // Multipart (file upload)
  await server.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
    },
  })

  // WebSocket support
  await server.register(websocket, { options: { maxPayload: 16384 } })

  // Rate Limiting — global protection
  await server.register(rateLimit, {
    global: true,
    max: 1000,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
    }),
  })

  // Cloudflare R2 / S3
  await server.register(r2)

  // Health check route
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }))

  // Kiểm kết nối Cloudflare R2 khi API đang chạy
  server.get('/health/storage', async (_request, reply) => {
    try {
      return { status: 'ok', provider: 'cloudflare-r2', ...(await server.r2.storage.checkConnection()) }
    } catch (error) {
      return reply.status(503).send({ status: 'error', provider: 'cloudflare-r2', message: error instanceof Error ? error.message : 'unknown' })
    }
  })
}
