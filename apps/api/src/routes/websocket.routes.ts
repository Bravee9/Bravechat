// ============================================================
// apps/api/src/routes/websocket.routes.ts
// WebSocket route xử lý chat thời gian thực (Real-time Messaging)
// ============================================================

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import Redis from 'ioredis'
import { randomUUID } from 'node:crypto'
import { prisma } from '../config/prisma'
import { env } from '../config/env'

interface ClientSession {
  channelId?: string
  databaseChannelId?: string
  serverId?: string
  user?: {
    id?: string
    username?: string
    avatar?: string
  }
}

// In-memory rooms: channelId -> Set<WebSocket>
const channelRooms = new Map<string, Set<WebSocket>>()
const serverRooms = new Map<string, Set<WebSocket>>()
// Metadata per connection
const clientSessions = new Map<WebSocket, ClientSession>()
// In-memory fallback message cache (50 messages per channel)
const memoryMessageStore = new Map<string, any[]>()
const instanceId = randomUUID()
let redisPublisher: Redis | null = null
let redisSubscriber: Redis | null = null

function ensureRedis(server: FastifyInstance) {
  if (redisPublisher) return
  redisPublisher = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  redisSubscriber = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  redisPublisher.on('error', (error) => server.log.warn(error, 'Redis publish unavailable'))
  redisSubscriber.on('error', (error) => server.log.warn(error, 'Redis subscribe unavailable'))
  void redisPublisher.connect().catch(() => {})
  void redisSubscriber.connect().then(() => redisSubscriber?.subscribe('bravechat:realtime')).catch(() => {})
  redisSubscriber.on('message', (_channel, raw) => {
    try {
      const envelope = JSON.parse(raw)
      if (envelope.origin !== instanceId) {
        if (envelope.room === 'server') broadcastToServer(envelope.serverId, envelope.payload)
        else broadcastToChannel(envelope.channelId, envelope.payload)
      }
    } catch (error) {
      server.log.warn(error, 'Invalid Redis realtime payload')
    }
  })
}

function publishToChannel(channelId: string, payload: any, senderSocket?: WebSocket) {
  broadcastToChannel(channelId, payload, senderSocket)
  if (redisPublisher?.status === 'ready') {
    void redisPublisher.publish('bravechat:realtime', JSON.stringify({ origin: instanceId, channelId, payload })).catch(() => {})
  }
}

export function publishChannelMessage(channelId: string, message: any) {
  publishToChannel(channelId, { type: 'message_create', channelId, message, echoBack: true })
}

function publishToServer(serverId: string, payload: any) {
  broadcastToServer(serverId, payload)
  if (redisPublisher?.status === 'ready') {
    void redisPublisher.publish('bravechat:realtime', JSON.stringify({ origin: instanceId, room: 'server', serverId, payload })).catch(() => {})
  }
}

function broadcastToChannel(channelId: string, payload: any, senderSocket?: WebSocket) {
  const sockets = channelRooms.get(channelId)
  if (!sockets) return

  const messageStr = JSON.stringify(payload)
  for (const client of sockets) {
    if (client.readyState === 1 /* OPEN */) {
      if (!senderSocket || client !== senderSocket || payload.echoBack) {
        client.send(messageStr)
      }
    }
  }
}

function broadcastToServer(serverId: string, payload: any) {
  const sockets = serverRooms.get(serverId)
  if (!sockets) return
  const message = JSON.stringify(payload)
  for (const client of sockets) if (client.readyState === 1) client.send(message)
}

function leaveCurrentChannel(socket: WebSocket) {
  const session = clientSessions.get(socket)
  if (!session || !session.channelId) return

  const room = channelRooms.get(session.channelId)
  if (room) {
    room.delete(socket)
    if (room.size === 0) {
      channelRooms.delete(session.channelId)
    }
  }
  session.channelId = undefined
}

export async function websocketRoutes(server: FastifyInstance) {
  ensureRedis(server)
  server.get('/ws', {
    websocket: true,
    preValidation: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch {
        return reply.code(401).send({ statusCode: 401, message: 'Authentication required' })
      }
    },
  }, (socket: WebSocket, req) => {
    const claims = req.user as { id: string; username: string }
    clientSessions.set(socket, { user: { id: claims.id, username: claims.username } })
    server.log.info('🔌 WebSocket client connected')

    // Gửi event chào mừng và xác nhận kết nối
    socket.send(
      JSON.stringify({
        type: 'connected',
        message: 'Kết nối WebSocket tới Bravechat API thành công!',
        timestamp: new Date().toISOString(),
      })
    )

    socket.on('message', async (raw: any) => {
      try {
        const data = JSON.parse(raw.toString())
        const session = clientSessions.get(socket) || {}

        switch (data.type) {
          case 'join_server': {
            const serverId = String(data.serverId || '')
            if (!serverId) return
            const authenticated = clientSessions.get(socket)
            const isMember = authenticated?.user?.id && await prisma.serverMember.findFirst({ where: { serverId, userId: authenticated.user.id, isBanned: false }, select: { id: true } })
            if (!isMember) return socket.close(1008, 'Not a server member')
            const previousServerId = session.serverId
            const previousRoom = previousServerId ? serverRooms.get(previousServerId) : undefined
            previousRoom?.delete(socket)
            if (previousRoom?.size === 0 && previousServerId) serverRooms.delete(previousServerId)
            if (!serverRooms.has(serverId)) serverRooms.set(serverId, new Set())
            serverRooms.get(serverId)!.add(socket)
            session.serverId = serverId
            clientSessions.set(socket, session)
            break
          }
          case 'join_channel': {
            const channelId = String(data.channelId || '')
            const databaseChannelId = String(data.channelKey || channelId)
            const authenticated = clientSessions.get(socket)
            if (!channelId || !authenticated?.user?.id) return socket.close(1008, 'Authentication required')
            const allowedChannel = await prisma.channel.findFirst({
              where: { id: databaseChannelId, server: { members: { some: { userId: authenticated.user.id, isBanned: false } } } },
              select: { id: true, serverId: true },
            })
            if (!allowedChannel) return socket.close(1008, 'Not a channel member')
            leaveCurrentChannel(socket)

            if (!channelRooms.has(channelId)) {
              channelRooms.set(channelId, new Set())
            }
            channelRooms.get(channelId)!.add(socket)

            session.channelId = channelId
            session.user = authenticated.user
            session.databaseChannelId = databaseChannelId
            session.serverId = allowedChannel.serverId
            clientSessions.set(socket, session)

            // Lấy lịch sử tin nhắn
            let history: any[] = []
            try {
              // Thử truy vấn Prisma DB nếu có
              const dbMessages = await prisma.message.findMany({
                where: { channelId: databaseChannelId, isDeleted: false },
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                  author: {
                    select: { id: true, username: true, displayName: true, avatarKey: true },
                  },
                  attachments: true,
                },
              })
              if (dbMessages && dbMessages.length > 0) {
                history = dbMessages.reverse().map((m: any) => ({
                  id: m.id,
                  channelId: m.channelId,
                  content: m.content,
                  time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  createdAt: m.createdAt,
                  user: m.author.displayName || m.author.username,
                  avatar: (m.author.displayName || m.author.username).slice(0, 2).toUpperCase(),
                  attachments: m.attachments.map((attachment: any) => ({ id: attachment.id, filename: attachment.filename, contentType: attachment.contentType, size: attachment.size })),
                }))
              }
            } catch (err) {
              // DB fallback: dùng in-memory store
              history = memoryMessageStore.get(channelId) || []
            }

            if (history.length === 0) {
              history = memoryMessageStore.get(channelId) || []
            }

            // Gửi initial messages cho client vừa join
            socket.send(
              JSON.stringify({
                type: 'channel_joined',
                channelId,
                messages: history,
              })
            )
            break
          }

          case 'load_older_messages': {
            const channelId = String(data.channelId || session.channelId || '')
            const databaseChannelId = session.databaseChannelId
            if (!session.user?.id || channelId !== session.channelId || !databaseChannelId) return
            const before = new Date(data.before)
            if (!channelId || Number.isNaN(before.getTime())) return
            const olderMessages = await prisma.message.findMany({
              where: { channelId: databaseChannelId, isDeleted: false, createdAt: { lt: before }, channel: { server: { members: { some: { userId: session.user.id, isBanned: false } } } } },
              take: 50,
              orderBy: { createdAt: 'desc' },
              include: { author: { select: { id: true, username: true, displayName: true, avatarKey: true } }, attachments: true },
            })
            socket.send(JSON.stringify({
              type: 'older_messages',
              channelId,
              messages: olderMessages.reverse().map((message: any) => ({
                id: message.id,
                channelId: message.channelId,
                content: message.content,
                time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: message.createdAt,
                user: message.author.displayName || message.author.username,
                avatar: (message.author.displayName || message.author.username).slice(0, 2).toUpperCase(),
                attachments: message.attachments.map((attachment: any) => ({ id: attachment.id, filename: attachment.filename, contentType: attachment.contentType, size: attachment.size })),
              })),
            }))
            break
          }

          case 'send_message': {
            const channelId = String(data.channelId || session.channelId || '')
            if (!session.user?.id || !channelId || channelId !== session.channelId || !session.databaseChannelId) return
            const content = String(data.content || '').trim()
            if (!content || content.length > 2000) return
            const user = session.user
            const username = user.username || 'Người dùng'

            const now = new Date()
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const messageObj = {
              id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              channelId,
              content,
              time: `Hôm nay lúc ${timeStr}`,
              createdAt: now.toISOString(),
              user: username,
              avatar: user.avatar || username.slice(0, 2).toUpperCase(),
              isHighlighted: false,
            }

            // Lưu vào in-memory store
            if (!memoryMessageStore.has(channelId)) {
              memoryMessageStore.set(channelId, [])
            }
            const store = memoryMessageStore.get(channelId)!
            store.push(messageObj)
            if (store.length > 100) store.shift() // giữ 100 tin gần nhất

            const persisted = await prisma.message.create({ data: { channelId: session.databaseChannelId, authorId: user.id!, content } })
            messageObj.id = persisted.id
            messageObj.createdAt = persisted.createdAt.toISOString()

            // Broadcast ngay lập tức tới tất cả client trong channel (kể cả người gửi)
            publishToChannel(channelId, {
              type: 'message_create',
              channelId,
              message: messageObj,
              echoBack: true,
            })
            if (session.serverId) {
              publishToServer(session.serverId, {
                type: 'message_create',
                serverId: session.serverId,
                channelKey: session.databaseChannelId,
                message: messageObj,
              })
            }
            break
          }

          case 'typing_start': {
            const channelId = data.channelId || session.channelId
            if (session.user?.id && channelId && channelId === session.channelId) {
              publishToChannel(
                channelId,
                {
                  type: 'typing_start',
                  channelId,
                  username: session.user.username || 'Ai đó',
                },
                socket
              )
            }
            break
          }

          case 'typing_stop': {
            const channelId = data.channelId || session.channelId
            if (session.user?.id && channelId && channelId === session.channelId) {
              publishToChannel(
                channelId,
                {
                  type: 'typing_stop',
                  channelId,
                  username: session.user.username,
                },
                socket
              )
            }
            break
          }

          default:
            break
        }
      } catch (err) {
        server.log.error(err, 'Lỗi xử lý WebSocket message')
      }
    })

    socket.on('close', () => {
      leaveCurrentChannel(socket)
      const serverId = clientSessions.get(socket)?.serverId
      if (serverId) {
        const room = serverRooms.get(serverId)
        room?.delete(socket)
        if (room?.size === 0) serverRooms.delete(serverId)
      }
      clientSessions.delete(socket)
      server.log.info('🔌 WebSocket client disconnected')
    })

    socket.on('error', (err: any) => {
      server.log.error(err, 'WebSocket socket error')
      leaveCurrentChannel(socket)
      const serverId = clientSessions.get(socket)?.serverId
      if (serverId) {
        const room = serverRooms.get(serverId)
        room?.delete(socket)
        if (room?.size === 0) serverRooms.delete(serverId)
      }
      clientSessions.delete(socket)
    })
  })
}

