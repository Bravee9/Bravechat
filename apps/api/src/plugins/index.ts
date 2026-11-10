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
      const keys = await client.keys(`*${ip}*`)
      if (keys.length > 0) await client.del(...keys)
    } catch {
      // ignore
    }
  }
}

const normalizeOrigin = (value: string) => value.replace(/\/$/, '')

export async function registerPlugins(server: FastifyInstance) {
  server.addContentTypeParser('application/webhook+json', { parseAs: 'string' }, (_request, body, done) => done(null, body))
  // CORS — allow frontend origin
  await server.register(cors, {
    origin: [normalizeOrigin(env.FRONTEND_URL)],
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
    // Exemption for unban endpoint in non-production environments
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
    if (origin && origin !== normalizeOrigin(env.FRONTEND_URL) && (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || request.headers.upgrade === 'websocket')) {
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

  // Rate Limiting — global protection backed by Redis distributed store
  const redisClient = getRedisClient()
  await server.register(rateLimit, {
    global: true,
    max: 120, // 120 requests / min / IP
    timeWindow: '1 minute',
    redis: redisClient ?? undefined,
    ban: 3, // Automatically ban IP if limit is exceeded 3 times
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
    version: '0.1.0',
    redis: redisClient ? 'connected' : 'disabled',
  }))

  // Testing & Security Administration endpoint
  server.post('/security/unban', async (request, reply) => {
    // Only permit local requests or requests with valid master secret in development/test
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

  // Kiểm kết nối Cloudflare R2 khi API đang chạy
  server.get('/health/storage', async (_request, reply) => {
    try {
      return { status: 'ok', provider: 'cloudflare-r2', ...(await server.r2.storage.checkConnection()) }
    } catch (error) {
      return reply.status(503).send({ status: 'error', provider: 'cloudflare-r2', message: error instanceof Error ? error.message : 'unknown' })
    }
  })
}
