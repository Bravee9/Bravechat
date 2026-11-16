import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import Redis from 'ioredis'
import { randomUUID } from 'node:crypto'
import { prisma } from '../config/prisma'
import { env } from '../config/env'

interface Session { userId: string; sid: string; expires: number; username: string; channelId?: string; channelServerId?: string; servers: Set<string> }
const rooms = { channel: new Map<string, Set<WebSocket>>(), server: new Map<string, Set<WebSocket>>(), user: new Map<string, Set<WebSocket>>() }
const sessions = new Map<WebSocket, Session>()
const instance = randomUUID()
let publisher: Redis | undefined
let subscriber: Redis | undefined
function join(kind: keyof typeof rooms, id: string, socket: WebSocket) {
  if (!rooms[kind].has(id)) rooms[kind].set(id, new Set())
  rooms[kind].get(id)!.add(socket)
}
function leave(kind: keyof typeof rooms, id: string | undefined, socket: WebSocket) {
  if (!id) return
  const room = rooms[kind].get(id); room?.delete(socket)
  if (!room?.size) rooms[kind].delete(id)
}
function broadcast(kind: keyof typeof rooms, id: string, payload: any, except?: WebSocket) {
  for (const socket of rooms[kind].get(id) ?? []) if (socket.readyState === 1 && socket !== except) socket.send(JSON.stringify(payload))
}
function relay(event: any) { if (publisher?.status === 'ready') void publisher.publish('bravechat:realtime', JSON.stringify({ origin: instance, ...event })).catch(() => undefined) }
function publish(kind: keyof typeof rooms, id: string, payload: any, except?: WebSocket) {
  broadcast(kind, id, payload, except); relay({ kind, id, payload })
}
export const publishUserEvent = (userId: string, payload: any) => publish('user', userId, payload)
export const publishChannelEvent = (channelId: string, payload: any) => publish('channel', channelId, { ...payload, channelId })
export function publishChannelMessage(channelId: string, message: any, serverId?: string) {
  publishChannelEvent(channelId, { type: 'message_create', message })
  if (serverId) publish('server', serverId, { type: 'message_create', serverId, channelKey: channelId, message })
}
export function revokeServerMembership(serverId: string, userId: string, local = false) {
  for (const [socket, session] of sessions) if (session.userId === userId) {
    leave('server', serverId, socket); session.servers.delete(serverId)
    if (session.channelServerId === serverId) socket.close(1008, 'Membership revoked')
  }
  if (!local) relay({ action: 'membership_revoked', serverId, userId })
}
export function revokeSessions(userId: string, sid?: string, local = false) {
  for (const [socket, session] of sessions) if (session.userId === userId && (!sid || sid === session.sid)) socket.close(1008, 'Session expired')
  if (!local) relay({ action: 'session_revoked', userId, sid })
}
function ensureRedis(server: FastifyInstance) {
  if (env.REDIS_ENABLED !== 'true' || publisher) return
  publisher = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  subscriber = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  publisher.on('error', (error) => server.log.warn(error, 'Realtime publisher unavailable'))
  subscriber.on('error', (error) => server.log.warn(error, 'Realtime subscriber unavailable'))
  void publisher.connect().catch(() => undefined)
  void subscriber.connect().then(() => subscriber!.subscribe('bravechat:realtime')).catch(() => undefined)
  subscriber.on('message', (_topic, raw) => {
    try {
      const event = JSON.parse(raw)
      if (event.origin === instance) return
      if (event.action === 'membership_revoked') revokeServerMembership(event.serverId, event.userId, true)
      else if (event.action === 'session_revoked') revokeSessions(event.userId, event.sid, true)
      else if (event.kind in rooms) broadcast(event.kind, event.id, event.payload)
    } catch (error) { server.log.warn(error, 'Invalid realtime payload') }
  })
  server.addHook('onClose', async () => { publisher?.disconnect(); subscriber?.disconnect(); publisher = undefined; subscriber = undefined })
}
export async function websocketRoutes(server: FastifyInstance) {
  ensureRedis(server)
  server.get('/ws', { websocket: true, preValidation: server.authenticate }, (socket: WebSocket, request) => {
    const claims = request.user as typeof request.user & { exp: number }
    const session: Session = { userId: claims.id, username: claims.username, sid: claims.sid, expires: claims.exp * 1000, servers: new Set() }
    // User room lấy từ JWT đã kiểm tra DB; client không được tự chọn người nhận DM.
    sessions.set(socket, session); join('user', session.userId, socket)
    socket.send(JSON.stringify({ type: 'connected', userId: session.userId }))
    let alive = true; let queued = 0; let sequence = Promise.resolve()
    const heartbeat = setInterval(() => { if (!alive || session.expires <= Date.now()) return socket.terminate(); alive = false; socket.ping() }, 30000)
    socket.on('pong', () => { alive = true })
    socket.on('message', (raw) => {
      if (++queued > 30) return socket.close(1008, 'Too many events')
      // Xử lý tuần tự để một join chậm không ghi đè kênh được chọn sau đó.
      sequence = sequence.then(async () => {
        if (socket.readyState !== 1) return
        const valid = session.expires > Date.now() && await prisma.refreshToken.findFirst({ where: { id: session.sid, userId: session.userId, isRevoked: false, expiresAt: { gt: new Date() }, user: { isBanned: false } }, select: { id: true } })
        if (!valid) return socket.close(1008, 'Session expired')
        const data = JSON.parse(raw.toString())
        if (data.type === 'join_server') {
          const id = String(data.serverId ?? '')
          const member = await prisma.serverMember.findFirst({ where: { serverId: id, userId: session.userId, isBanned: false }, select: { id: true } })
          if (!member) return socket.send(JSON.stringify({ type: 'server_unavailable', serverId: id }))
          join('server', id, socket); session.servers.add(id)
          socket.send(JSON.stringify({ type: 'server_joined', serverId: id }))
        } else if (data.type === 'join_channel') {
          const id = String(data.channelId ?? '')
          const channel = await prisma.channel.findFirst({ where: { id, server: { members: { some: { userId: session.userId, isBanned: false } } } }, select: { id: true, serverId: true } })
          if (!channel) return socket.close(1008, 'Not a channel member')
          leave('channel', session.channelId, socket); join('channel', id, socket)
          session.channelId = id; session.channelServerId = channel.serverId
          socket.send(JSON.stringify({ type: 'channel_joined', channelId: id, messages: [] }))
        } else if (data.type === 'leave_channel') {
          if (session.channelId === data.channelId) { leave('channel', session.channelId, socket); session.channelId = undefined; session.channelServerId = undefined }
        } else if (data.type === 'typing_start' || data.type === 'typing_stop') {
          if (data.channelId !== session.channelId || !session.channelId) return
          publish('channel', session.channelId, { type: data.type, channelId: session.channelId, username: session.username }, socket)
        } else if (data.type === 'send_message') {
          socket.send(JSON.stringify({ type: 'error', message: 'Vui lòng gửi tin qua API để nhận xác nhận lưu.' }))
        }
      }).catch((error) => { server.log.warn(error, 'Realtime event failed'); if (socket.readyState === 1) socket.send(JSON.stringify({ type: 'error', message: 'Không thể xử lý cập nhật.' })) }).finally(() => { queued-- })
    })
    const cleanup = () => {
      clearInterval(heartbeat); sessions.delete(socket); leave('user', session.userId, socket)
      if (session.channelId) { publish('channel', session.channelId, { type: 'typing_stop', channelId: session.channelId, username: session.username }, socket); leave('channel', session.channelId, socket) }
      for (const id of session.servers) leave('server', id, socket)
    }
    socket.on('close', cleanup); socket.on('error', cleanup)
  })
}
