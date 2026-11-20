// ============================================================
// apps/api/src/plugins/index.ts
// Register all Fastify plugins & security layers
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
import Redis from 'ioredis'

let redisClientInstance: Redis | null = null
const localBlacklistCache = new Map<string, number>()

function getRedisClient(): Redis | null {
  if (env.REDIS_ENABLED !== 'true') return null
  if (!redisClientInstance && env.REDIS_URL) {
    redisClientInstance = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
    })
    redisClientInstance.on('error', () => undefined)
  }
  return redisClientInstance
}

async function isIpBlacklisted(ip: string): Promise<boolean> {
  const now = Date.now()
  const cachedExpiry = localBlacklistCache.get(ip)
  if (cachedExpiry) {
    if (cachedExpiry > now) return true
    localBlacklistCache.delete(ip)
  }
  const client = getRedisClient()
  if (!client) return false
  try {
    const isBanned = await client.exists(`bravechat:blacklist:${ip}`)
    if (isBanned === 1) {
      const ttl = await client.ttl(`bravechat:blacklist:${ip}`)
      localBlacklistCache.set(ip, now + (ttl > 0 ? ttl * 1000 : 900000))
      return true
    }
  } catch {
    return false
  }
  return false
}

async function blacklistIp(ip: string, ttlSeconds = 900, reason = 'Excessive traffic'): Promise<void> {
  localBlacklistCache.set(ip, Date.now() + ttlSeconds * 1000)
  const client = getRedisClient()
  if (client) {
    try {
      await client.set(`bravechat:blacklist:${ip}`, JSON.stringify({ reason, bannedAt: new Date().toISOString() }), 'EX', ttlSeconds)
    } catch {
      // ignore
    }
  }
}

async function recordRateLimitViolation(ip: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  try {
    const strikeKey = `bravechat:strikes:${ip}`
    const strikeCount = await client.incr(strikeKey)
    if (strikeCount === 1) await client.expire(strikeKey, 300)
    if (strikeCount >= 3) await blacklistIp(ip, 900, 'Automated botnet defense')
  } catch {
    // ignore
  }
}

async function unblacklistIp(ip: string): Promise<void> {
  localBlacklistCache.delete(ip)
  const client = getRedisClient()
  if (client) {
    try {
      await client.del(
        `bravechat:blacklist:${ip}`,
        `bravechat:strikes:${ip}`,
        `fastify-rate-limit-${ip}`
      )
    } catch {
      // ignore
    }
  }
}

const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '')

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>([normalizeOrigin(env.FRONTEND_URL)])
  const extra = (env as { CORS_ORIGINS?: string }).CORS_ORIGINS
  if (extra) {
    for (const item of extra.split(',')) {
      const normalized = normalizeOrigin(item)
      if (normalized) origins.add(normalized)
    }
  }
  return origins
}

export async function registerPlugins(server: FastifyInstance) {
  const allowedOrigins = buildAllowedOrigins()
  server.addContentTypeParser('application/webhook+json', { parseAs: 'string' }, (_request, body, done) => done(null, body))

  // Security headers hook for all API responses
  server.addHook('onSend', async (_request, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    reply.header('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()')
    reply.header('Cross-Origin-Resource-Policy', 'cross-origin')
    if (env.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    return payload
  })

  // CORS — allow configured frontend origins
  await server.register(cors, {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      callback(null, allowedOrigins.has(normalizeOrigin(origin)))
    },
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

  // Early onRequest hook: Layer 7 Botnet Defense & Origin Protection
  server.addHook('onRequest', async (request, reply) => {
    if (env.NODE_ENV !== 'production' && request.url === '/security/unban') {
      return
    }

    // 1. Check if IP is in the automated blacklist / jail
    const isBanned = await isIpBlacklisted(request.ip)
    if (isBanned) {
      return reply.code(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Địa chỉ IP của bạn tạm thời bị khóa do phát hiện hành vi tấn công bất thường (Botnet/Flood Defense). Thử lại sau 15 phút.',
      })
    }

    // 2. CSRF / Origin validation for mutating requests
    const origin = request.headers.origin && normalizeOrigin(request.headers.origin)
    if (origin && !allowedOrigins.has(origin) && (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || request.headers.upgrade === 'websocket')) {
      return reply.code(403).send({ statusCode: 403, message: 'Origin không được phép.' })
    }
  })

  // Multipart (file upload)
  await server.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
    },
  })

  // WebSocket support
  await server.register(websocket, { options: { maxPayload: 16384 } })

  // Rate Limiting — global protection backed by Redis distributed store.
  // Authenticated users on shared NAT/Wi-Fi are keyed per session tail + IP so concurrent users on the same network do not ban each other,
  // while unauthenticated traffic/floods are strictly keyed per IP.
  const redisClient = getRedisClient()
  await server.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    redis: redisClient ?? undefined,
    ban: 3,
    keyGenerator: (req) => {
      const tokenCookie = req.cookies?.token
      if (tokenCookie && tokenCookie.length > 24 && !req.url.startsWith('/api/auth/login') && !req.url.startsWith('/api/auth/register') && !req.url.startsWith('/api/auth/forgot-password')) {
        return `${req.ip}:s:${tokenCookie.slice(-16)}`
      }
      return req.ip
    },
    allowList: (req) => req.url.startsWith('/security/unban'),
    onBanReach: async (req) => {
      await blacklistIp(req.ip, 900, 'Fastify Rate Limit ban threshold reached')
    },
    onExceeded: async (req) => {
      await recordRateLimitViolation(req.ip)
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: context.ban ? 403 : 429,
      error: context.ban ? 'Forbidden' : 'Too Many Requests',
      message: context.ban
        ? 'Địa chỉ IP của bạn đã bị đưa vào danh sách đen (15 phút) do vi phạm giới hạn yêu cầu nhiều lần (Botnet Defense).'
        : 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
      retryAfter: context.after,
    }),
  })

  // Cloudflare R2 / S3
  await server.register(r2)

  // Health check route
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisClient ? 'connected' : 'disabled',
  }))

  // Testing & Security Administration endpoint (disabled in production)
  server.post('/security/unban', async (request, reply) => {
    if (env.NODE_ENV === 'production') {
      return reply.code(404).send()
    }
    const body = request.body as { ip?: string }
    const targetIp = body?.ip || request.ip
    await unblacklistIp(targetIp)
    if (['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(targetIp)) {
      await unblacklistIp('127.0.0.1')
      await unblacklistIp('::1')
      await unblacklistIp('::ffff:127.0.0.1')
    }
    return { status: 'ok', unbanned: targetIp }
  })

  // Storage health check — hides bucket names and raw SDK stack traces in production
  server.get('/health/storage', async (_request, reply) => {
    try {
      const info = await server.r2.storage.checkConnection()
      if (env.NODE_ENV === 'production') {
        return { status: 'ok', latencyMs: info.latencyMs }
      }
      return { status: 'ok', provider: 'cloudflare-r2', ...info }
    } catch (error) {
      if (env.NODE_ENV === 'production') {
        return reply.status(503).send({ status: 'error', message: 'Dịch vụ lưu trữ tạm thời không khả dụng.' })
      }
      return reply.status(503).send({ status: 'error', provider: 'cloudflare-r2', message: error instanceof Error ? error.message : 'unknown' })
    }
  })
}
