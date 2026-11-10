// ============================================================
// apps/api/src/config/redis.ts
// Centralized Redis client & Security IP Blacklist Manager
// ============================================================

import Redis from 'ioredis'
import { env } from './env'

let redisClient: Redis | null = null

// High-speed in-memory LRU cache for banned IPs to eliminate round-trip latency (sub-millisecond rejection)
const localBlacklistCache = new Map<string, number>()

export function getRedisClient(): Redis | null {
  if (env.REDIS_ENABLED !== 'true') return null

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 5) return null
        return Math.min(times * 200, 2000)
      },
    })

    redisClient.on('error', (err) => {
      console.warn('⚠️ [Redis] Connection warning:', err.message)
    })

    redisClient.on('connect', () => {
      console.log('✅ [Redis] Connected successfully to Redis server.')
    })
  }

  return redisClient
}

/**
 * Checks whether an IP is actively blacklisted.
 * Uses in-memory cache first for < 0.1ms rejection, falling back to Redis.
 */
export async function isIpBlacklisted(ip: string): Promise<boolean> {
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
    // Fail-open on Redis timeout so normal traffic is not blocked if Redis is down
    return false
  }

  return false
}

/**
 * Blacklists an IP for a specific duration (default: 15 minutes).
 */
export async function blacklistIp(ip: string, ttlSeconds = 900, reason = 'Excessive traffic / Botnet attack'): Promise<void> {
  const now = Date.now()
  localBlacklistCache.set(ip, now + ttlSeconds * 1000)

  const client = getRedisClient()
  if (client) {
    try {
      await client.set(`bravechat:blacklist:${ip}`, JSON.stringify({ reason, bannedAt: new Date().toISOString() }), 'EX', ttlSeconds)
    } catch (err) {
      console.error('Failed to set blacklist in Redis:', err)
    }
  }

  console.warn(`🚨 [SECURITY ALERT] IP ${ip} has been automatically banned for ${ttlSeconds}s. Reason: ${reason}`)
}

/**
 * Tracks rate limit violations. If an IP violates rate limits 3+ times within 5 minutes,
 * it is automatically banned for 15 minutes.
 */
export async function recordRateLimitViolation(ip: string): Promise<{ banned: boolean; strikeCount: number }> {
  const client = getRedisClient()
  if (!client) {
    return { banned: false, strikeCount: 1 }
  }

  try {
    const strikeKey = `bravechat:strikes:${ip}`
    const strikeCount = await client.incr(strikeKey)
    if (strikeCount === 1) {
      await client.expire(strikeKey, 300) // 5 minutes window
    }

    if (strikeCount >= 3) {
      await blacklistIp(ip, 900, `Automated botnet defense: ${strikeCount} rate-limit strikes within 5 minutes`)
      return { banned: true, strikeCount }
    }

    return { banned: false, strikeCount }
  } catch {
    return { banned: false, strikeCount: 1 }
  }
}

/**
 * Removes an IP from the blacklist.
 */
export async function unblacklistIp(ip: string): Promise<void> {
  localBlacklistCache.delete(ip)
  const client = getRedisClient()
  if (client) {
    try {
      const keys = await client.keys(`*${ip}*`)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch {
      // ignore
    }
  }
}
