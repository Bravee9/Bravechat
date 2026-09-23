// ============================================================
// apps/api/src/plugins/index.ts
// Register all Fastify plugins
// ============================================================

import type { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { env } from '../config/env'

export async function registerPlugins(server: FastifyInstance) {
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

  // Multipart (file upload)
  await server.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
    },
  })

  // WebSocket support
  await server.register(websocket)

  // Rate Limiting — global protection
  await server.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
    }),
  })

  // Health check route
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }))
}
