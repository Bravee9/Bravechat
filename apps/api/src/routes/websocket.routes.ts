// ============================================================
// apps/api/src/routes/websocket.routes.ts
// WebSocket route xử lý chat thời gian thực (Real-time Messaging)
// ============================================================

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import { prisma } from '../config/prisma'

interface ClientSession {
  channelId?: string
  user?: {
    id?: string
    username?: string
    avatar?: string
  }
}

// In-memory rooms: channelId -> Set<WebSocket>
const channelRooms = new Map<string, Set<WebSocket>>()
// Metadata per connection
const clientSessions = new Map<WebSocket, ClientSession>()
// In-memory fallback message cache (50 messages per channel)
const memoryMessageStore = new Map<string, any[]>()

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
  server.get('/ws', { websocket: true }, (socket: WebSocket, req) => {
    clientSessions.set(socket, {})
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
          case 'join_channel': {
            const channelId = String(data.channelId || 'general')
            leaveCurrentChannel(socket)

            if (!channelRooms.has(channelId)) {
              channelRooms.set(channelId, new Set())
            }
            channelRooms.get(channelId)!.add(socket)

            session.channelId = channelId
            session.user = data.user || {
              id: 'guest',
              username: 'Khách',
              avatar: 'KH',
            }
            clientSessions.set(socket, session)

            // Lấy lịch sử tin nhắn
            let history: any[] = []
            try {
              // Thử truy vấn Prisma DB nếu có
              const dbMessages = await prisma.message.findMany({
                where: { channelId, isDeleted: false },
                take: 50,
                orderBy: { createdAt: 'asc' },
                include: {
                  author: {
                    select: { id: true, username: true, displayName: true, avatarKey: true },
                  },
                },
              })
              if (dbMessages && dbMessages.length > 0) {
                history = dbMessages.map((m: any) => ({
                  id: m.id,
                  channelId: m.channelId,
                  content: m.content,
                  time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  createdAt: m.createdAt,
                  user: m.author.displayName || m.author.username,
                  avatar: (m.author.displayName || m.author.username).slice(0, 2).toUpperCase(),
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

          case 'send_message': {
            const channelId = String(data.channelId || session.channelId || 'general')
            const content = String(data.content || '').trim()
            if (!content) return

            const user = data.user || session.user || {
              id: 'guest',
              username: 'Ẩn danh',
              avatar: 'AD',
            }

            const now = new Date()
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const messageObj = {
              id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              channelId,
              content,
              time: `Hôm nay lúc ${timeStr}`,
              createdAt: now.toISOString(),
              user: user.username,
              avatar: user.avatar || user.username.slice(0, 2).toUpperCase(),
              isHighlighted: false,
            }

            // Lưu vào in-memory store
            if (!memoryMessageStore.has(channelId)) {
              memoryMessageStore.set(channelId, [])
            }
            const store = memoryMessageStore.get(channelId)!
            store.push(messageObj)
            if (store.length > 100) store.shift() // giữ 100 tin gần nhất

            // Thử lưu DB nếu có (background)
            if (user.id && user.id !== 'guest') {
              prisma.message.create({
                data: {
                  channelId,
                  authorId: user.id,
                  content,
                },
              }).catch(() => {})
            }

            // Broadcast ngay lập tức tới tất cả client trong channel (kể cả người gửi)
            broadcastToChannel(channelId, {
              type: 'message_create',
              channelId,
              message: messageObj,
              echoBack: true,
            })
            break
          }

          case 'typing_start': {
            const channelId = data.channelId || session.channelId
            if (channelId) {
              broadcastToChannel(
                channelId,
                {
                  type: 'typing_start',
                  channelId,
                  username: data.username || session.user?.username || 'Ai đó',
                },
                socket
              )
            }
            break
          }

          case 'typing_stop': {
            const channelId = data.channelId || session.channelId
            if (channelId) {
              broadcastToChannel(
                channelId,
                {
                  type: 'typing_stop',
                  channelId,
                  username: data.username || session.user?.username,
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
      clientSessions.delete(socket)
      server.log.info('🔌 WebSocket client disconnected')
    })

    socket.on('error', (err: any) => {
      server.log.error(err, 'WebSocket socket error')
      leaveCurrentChannel(socket)
      clientSessions.delete(socket)
    })
  })
}

