/**
 * apps/api/src/routes/user.routes.ts
 * User management: profile, avatar, status, friends
 *
 * GET    /api/users/:userId           — Xem profile user
 * PATCH  /api/users/@me              — Cập nhật profile của mình
 * PATCH  /api/users/@me/status       — Thay đổi trạng thái (online/idle/dnd)
 * POST   /api/users/@me/avatar       — Upload avatar
 * GET    /api/users/@me/friends      — Danh sách bạn bè
 * POST   /api/users/@me/friends      — Gửi lời mời kết bạn
 * PUT    /api/users/@me/friends/:id  — Chấp nhận/từ chối lời mời
 * DELETE /api/users/@me/friends/:id  — Hủy kết bạn / bỏ chặn
 */

import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { ASSET_RULES, mediaUrl, type AssetKind } from '../services/storage.service'
import { sniffImageType } from './upload.routes'

const profileSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-z0-9._]+$/).optional(),
  displayName: z.string().trim().min(1).max(32).nullable().optional(),
  bio: z.string().trim().max(190).nullable().optional(),
  customStatus: z.string().trim().max(128).nullable().optional(),
}).strict()

export async function userRoutes(server: FastifyInstance) {
  // All user routes require authentication
  server.addHook('preHandler', server.authenticate)

  server.get('/@me/servers', async (request, reply) => {
    const memberships = await prisma.serverMember.findMany({
      where: { userId: request.user.id, isBanned: false },
      include: { server: { select: { id: true, name: true, iconKey: true } } },
      orderBy: { joinedAt: 'asc' },
    })
    return reply.send({ statusCode: 200, data: memberships.map(({ server: item }) => ({
      id: item.id,
      name: item.name,
      iconUrl: mediaUrl(item.iconKey),
      hasUnread: false,
      mentionCount: 0,
    })) })
  })

  server.get('/@me/conversations', async (request, reply) => {
    const userId = request.user.id
    const rows = await prisma.directMessage.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }], isDeleted: false },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId', 'receiverId'],
      take: 100,
      include: { sender: { select: { id: true, username: true, displayName: true, avatarKey: true } }, receiver: { select: { id: true, username: true, displayName: true, avatarKey: true } } },
    })
    const conversations = rows.map((row) => {
      const other = row.senderId === userId ? row.receiver : row.sender
      return { id: other.id, user: { id: other.id, username: other.username, displayName: other.displayName, avatarUrl: mediaUrl(other.avatarKey), status: 'OFFLINE' as const }, lastMessage: row.content ?? 'Đã gửi tệp', lastMessageAt: row.createdAt.toISOString(), unreadCount: 0 }
    })
    return reply.send({ statusCode: 200, data: conversations })
  })

  server.get<{ Params: { userId: string } }>('/:userId', async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.params.userId }, select: { id: true, username: true, displayName: true, bio: true, avatarKey: true, bannerKey: true, status: true, customStatus: true } })
    if (!user) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy người dùng.' })
    return reply.send({ statusCode: 200, data: { user: { ...user, avatarUrl: mediaUrl(user.avatarKey), bannerUrl: mediaUrl(user.bannerKey) } } })
  })

  server.patch('/@me', async (request, reply) => {
    const parsed = profileSchema.safeParse(request.body)
    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return reply.status(400).send({ statusCode: 400, message: 'Thông tin hồ sơ không hợp lệ.', details: parsed.success ? undefined : parsed.error.flatten().fieldErrors })
    if (parsed.data.username) {
      const existing = await prisma.user.findFirst({ where: { username: parsed.data.username, id: { not: request.user.id } }, select: { id: true } })
      if (existing) return reply.status(409).send({ statusCode: 409, message: 'Tên người dùng đã được sử dụng.' })
    }
    const user = await prisma.user.update({ where: { id: request.user.id }, data: parsed.data, select: { id: true, email: true, username: true, displayName: true, bio: true, customStatus: true, status: true, discriminator: true, avatarKey: true, bannerKey: true } })
    return reply.send({ statusCode: 200, data: { user: { ...user, avatarUrl: mediaUrl(user.avatarKey), bannerUrl: mediaUrl(user.bannerKey) } } })
  })

  server.patch('/@me/status', async (request, reply) => {
    // TODO: UserService.updateStatus(userId, status)
    // Also publish to Redis Pub/Sub for real-time presence update
    return reply.send({ statusCode: 200 })
  })

  const uploadProfileAsset = (kind: AssetKind) => async (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    const file = await request.file().catch(() => undefined)
    if (!file) return reply.status(400).send({ statusCode: 400, message: 'Vui lòng chọn ảnh.' })
    let uploaded: Buffer
    try { uploaded = await file.toBuffer() } catch { return reply.status(413).send({ statusCode: 413, message: 'Ảnh vượt quá dung lượng cho phép.' }) }
    const contentType = sniffImageType(uploaded)
    const rule = ASSET_RULES[kind]
    if (!contentType) return reply.status(415).send({ statusCode: 415, message: 'Chỉ nhận ảnh PNG, JPG, GIF, WEBP hoặc AVIF.' })
    if (uploaded.length > rule.maxBytes) return reply.status(413).send({ statusCode: 413, message: `Ảnh tối đa ${Math.round(rule.maxBytes / 1024 / 1024)}MB.` })
    const current = await prisma.user.findUniqueOrThrow({ where: { id: request.user.id }, select: { avatarKey: true, bannerKey: true } })
    const pending = `pending/${request.user.id}/${randomUUID()}.${contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]}`
    await request.server.r2.storage.putObject(pending, uploaded, contentType)
    const key = await request.server.r2.storage.commitAsset(pending, kind, request.user.id, contentType)
    const field = kind === 'avatar' ? 'avatarKey' : 'bannerKey'
    const user = await prisma.user.update({ where: { id: request.user.id }, data: { [field]: key }, select: { id: true, email: true, username: true, displayName: true, bio: true, customStatus: true, status: true, discriminator: true, avatarKey: true, bannerKey: true } })
    await request.server.r2.storage.deleteQuietly(kind === 'avatar' ? current.avatarKey : current.bannerKey)
    return reply.send({ statusCode: 200, data: { user: { ...user, avatarUrl: mediaUrl(user.avatarKey), bannerUrl: mediaUrl(user.bannerKey) } } })
  }
  server.post('/@me/avatar', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, uploadProfileAsset('avatar'))
  server.post('/@me/banner', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, uploadProfileAsset('banner'))

  server.get('/@me/friends', async (request, reply) => {
    // TODO: UserService.getFriends(userId)
    return reply.send({ statusCode: 200, data: { friends: [] } })
  })

  server.post('/@me/friends', async (request, reply) => {
    // TODO: UserService.sendFriendRequest(fromId, toUsername)
    return reply.status(201).send({ statusCode: 201 })
  })

  server.put('/@me/friends/:friendshipId', async (request, reply) => {
    // TODO: UserService.respondToFriendRequest(friendshipId, action)
    return reply.send({ statusCode: 200 })
  })

  server.delete('/@me/friends/:friendshipId', async (request, reply) => {
    // TODO: UserService.removeFriend(userId, friendshipId)
    return reply.send({ statusCode: 200 })
  })
}
