import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { fail, friendshipPair, serializable } from '../services/conversation'
import { mediaUrl } from '../services/storage.service'
import { publishUserEvent } from './websocket.routes'

const selectUser = { id: true, username: true, displayName: true, avatarKey: true, status: true } as const
function notify(a: string, b: string) {
  for (const id of [a, b]) publishUserEvent(id, { type: 'friends_update' })
}
export async function friendRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)
  server.get('/', async (request) => {
    const id = request.user.id
    const rows = await prisma.friendship.findMany({ where: { OR: [{ userId: id }, { friendId: id }] }, include: { user: { select: selectUser }, friend: { select: selectUser } }, orderBy: { createdAt: 'desc' } })
    const groups: Record<string, unknown[]> = { friends: [], incoming: [], outgoing: [], blocked: [] }
    for (const row of rows) {
      // Chỉ chủ của block được xem/bỏ block; không tiết lộ ai đã chặn người dùng.
      if (row.status === 'BLOCKED' && row.userId !== id) continue
      const user = row.userId === id ? row.friend : row.user
      const group = row.status === 'BLOCKED' ? 'blocked' : row.status === 'ACCEPTED' ? 'friends' : row.userId === id ? 'outgoing' : 'incoming'
      groups[group].push({ id: row.id, status: row.status, user: { ...user, avatarUrl: mediaUrl(user.avatarKey) } })
    }
    return { statusCode: 200, data: groups }
  })
  server.post('/', { config: { rateLimit: { max: 15, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = z.object({ username: z.string().trim().toLowerCase().min(3).max(32) }).parse(request.body)
    const target = await prisma.user.findUnique({ where: { username: input.username }, select: { id: true, isBanned: true } })
    if (!target || target.isBanned) throw fail(404, 'Không tìm thấy người dùng.')
    if (target.id === request.user.id) throw fail(400, 'Bạn không thể kết bạn với chính mình.')
    const result = await serializable(async (tx) => {
      const rows = await tx.friendship.findMany({ where: friendshipPair(request.user.id, target.id) })
      if (rows.some((row) => row.status === 'BLOCKED')) throw fail(403, 'Không thể gửi lời mời cho người dùng này.')
      if (rows[0]) {
        if (rows[0].status === 'PENDING' && rows[0].friendId === request.user.id) throw fail(409, 'Người này đã gửi lời mời cho bạn. Hãy mở mục Đang chờ để chấp nhận.')
        return rows[0]
      }
      return tx.friendship.create({ data: { userId: request.user.id, friendId: target.id } })
    })
    notify(request.user.id, target.id)
    return reply.code(201).send({ statusCode: 201, data: { friendship: result } })
  })
  server.post('/block', async (request) => {
    const input = z.object({ userId: z.string().min(1) }).parse(request.body)
    const target = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } })
    if (!target || target.id === request.user.id) throw fail(400, 'Người dùng không hợp lệ.')
    const row = await serializable(async (tx) => {
      // Xóa quan hệ/lời mời cũ nhưng giữ nguyên block do người còn lại tạo.
      await tx.friendship.deleteMany({ where: { ...friendshipPair(request.user.id, target.id), status: { not: 'BLOCKED' } } })
      return tx.friendship.upsert({ where: { userId_friendId: { userId: request.user.id, friendId: target.id } }, create: { userId: request.user.id, friendId: target.id, status: 'BLOCKED' }, update: { status: 'BLOCKED' } })
    })
    notify(request.user.id, target.id)
    return { statusCode: 200, data: { friendship: row } }
  })
  server.put<{ Params: { friendshipId: string } }>('/:friendshipId', async (request) => {
    const { action } = z.object({ action: z.enum(['accept', 'reject']) }).parse(request.body)
    const row = await serializable(async (tx) => {
      const record = await tx.friendship.findFirst({ where: { id: request.params.friendshipId, friendId: request.user.id, status: 'PENDING' } })
      if (!record) throw fail(404, 'Không tìm thấy lời mời đang chờ dành cho bạn.')
      if (action === 'reject') await tx.friendship.delete({ where: { id: record.id } })
      else await tx.friendship.update({ where: { id: record.id }, data: { status: 'ACCEPTED' } })
      return record
    })
    notify(row.userId, row.friendId)
    return { statusCode: 200, data: null }
  })
  server.delete<{ Params: { friendshipId: string } }>('/:friendshipId', async (request) => {
    const row = await serializable(async (tx) => {
      const record = await tx.friendship.findFirst({ where: { id: request.params.friendshipId, OR: [{ userId: request.user.id }, { friendId: request.user.id }] } })
      if (!record || record.status === 'BLOCKED' && record.userId !== request.user.id) throw fail(404, 'Không tìm thấy quan hệ này.')
      await tx.friendship.delete({ where: { id: record.id } })
      return record
    })
    notify(row.userId, row.friendId)
    return { statusCode: 200, data: null }
  })
}
