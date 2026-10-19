import type { FastifyInstance } from 'fastify'
import { AccessToken, TrackSource, WebhookReceiver } from 'livekit-server-sdk'
import Redis from 'ioredis'
import { randomUUID } from 'node:crypto'
import { prisma } from '../config/prisma'
import { env } from '../config/env'

let presenceRedis: Redis | undefined
const getPresenceRedis = () => presenceRedis ??= new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })

export async function voiceRoutes(server: FastifyInstance) {
  server.post<{ Params: { channelId: string } }>('/channels/:channelId/token', { preHandler: [server.authenticate] }, async (request, reply) => {
    if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      return reply.status(503).send({ statusCode: 503, message: 'Voice/video chưa được cấu hình trên máy chủ.' })
    }
    const channel = await prisma.channel.findFirst({
      where: {
        id: request.params.channelId,
        type: { in: ['VOICE', 'VIDEO'] },
        server: { members: { some: { userId: request.user.id, isBanned: false } } },
      },
      select: { id: true, type: true, userLimit: true, server: { select: { members: { where: { userId: request.user.id }, select: { user: { select: { username: true, displayName: true } } } } } } },
    })
    if (!channel) return reply.status(404).send({ statusCode: 404, message: 'Voice/video channel không tồn tại hoặc bạn không có quyền tham gia.' })
    const roomName = `channel:${channel.id}`
    if (channel.userLimit && channel.userLimit > 0) {
      try {
        const redis = getPresenceRedis()
        if (redis.status === 'wait') await redis.connect()
        const presenceKey = `bravechat:voice:${roomName}`
        const alreadyJoined = await redis.sismember(presenceKey, request.user.id)
        if (!alreadyJoined && await redis.scard(presenceKey) >= channel.userLimit) {
          return reply.status(409).send({ statusCode: 409, message: 'Voice room đã đạt giới hạn người tham gia.' })
        }
      } catch (error) {
        request.log.error(error, 'Could not verify voice room capacity')
        return reply.status(503).send({ statusCode: 503, message: 'Không thể kiểm tra sức chứa của voice room.' })
      }
    }
    const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: `${request.user.id}:${randomUUID()}`,
      name: channel.server.members[0]?.user.displayName || channel.server.members[0]?.user.username || request.user.username,
      ttl: `${env.LIVEKIT_TOKEN_TTL_SECONDS}s`,
      metadata: JSON.stringify({ channelId: channel.id, channelType: channel.type }),
    })
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublishSources: channel.type === 'VIDEO' ? [TrackSource.MICROPHONE, TrackSource.CAMERA] : [TrackSource.MICROPHONE],
      canSubscribe: true,
      canPublishData: true,
    })
    return reply.send({ statusCode: 200, data: { serverUrl: env.LIVEKIT_URL, token: await token.toJwt(), roomName, channelType: channel.type } })
  })

  server.post('/webhook', { config: { rateLimit: { max: 600, timeWindow: '1 minute' } } }, async (request, reply) => {
    if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) return reply.status(503).send({ statusCode: 503 })
    const authorization = request.headers.authorization
    if (typeof request.body !== 'string' || !authorization) return reply.status(400).send({ statusCode: 400, message: 'Webhook payload không hợp lệ.' })
    try {
      const receiver = new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET)
      const event = await receiver.receive(request.body, authorization)
      const roomName = event.room?.name
      if (!roomName?.startsWith('channel:')) return reply.send({ statusCode: 200 })
      const redis = getPresenceRedis()
      if (redis.status === 'wait') await redis.connect()
      const key = `bravechat:voice:${roomName}`
      const participantIdentity = event.participant?.identity
      if (event.event === 'participant_joined' && participantIdentity) {
        await redis.sadd(key, participantIdentity)
        await redis.expire(key, 3600)
      } else if (event.event === 'participant_left' && participantIdentity) {
        await redis.srem(key, participantIdentity)
        await redis.expire(key, 3600)
      } else if (event.event === 'room_finished') {
        await redis.del(key)
      }
      return reply.send({ statusCode: 200 })
    } catch (error) {
      request.log.warn(error, 'Rejected LiveKit webhook')
      return reply.status(401).send({ statusCode: 401, message: 'Chữ ký webhook không hợp lệ.' })
    }
  })
}
