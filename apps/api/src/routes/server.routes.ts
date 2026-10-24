import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { mediaUrl } from '../services/storage.service'
import { revokeServerMembership } from './websocket.routes'

const createSchema = z.object({ name: z.string().trim().min(2).max(100) })

type ServerDetailRecord = Prisma.ServerGetPayload<{ include: { categories: true; channels: true } }>

function toServerDetail(server: ServerDetailRecord) {
  return {
    id: server.id,
    name: server.name,
    iconUrl: mediaUrl(server.iconKey),
    bannerUrl: mediaUrl(server.bannerKey),
    description: server.description,
    ownerId: server.ownerId,
    categories: server.categories.map((category) => ({ id: category.id, serverId: category.serverId, name: category.name, position: category.position })),
    channels: server.channels.map((channel) => ({
      id: channel.id,
      serverId: channel.serverId,
      categoryId: channel.categoryId,
      name: channel.name,
      type: channel.type,
      topic: channel.topic,
      position: channel.position,
      hasUnread: false,
      mentionCount: 0,
    })),
  }
}

export async function serverRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)

  server.get('/', async (request, reply) => {
    const memberships = await prisma.serverMember.findMany({
      where: { userId: request.user.id, isBanned: false },
      include: { server: { select: { id: true, name: true, iconKey: true } } },
      orderBy: { joinedAt: 'asc' },
    })
    return reply.send({ statusCode: 200, data: memberships.map(({ server: item }) => ({ id: item.id, name: item.name, iconUrl: mediaUrl(item.iconKey), hasUnread: false, mentionCount: 0 })) })
  })

  server.post<{ Body: z.infer<typeof createSchema> }>('/', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, message: 'Tên server cần dài từ 2 đến 100 ký tự.' })
    const serverId = await prisma.$transaction(async (transaction) => {
      const createdServer = await transaction.server.create({ data: { name: parsed.data.name, ownerId: request.user.id } })
      await transaction.serverMember.create({ data: { userId: request.user.id, serverId: createdServer.id, isOwner: true } })
      const category = await transaction.channelCategory.create({ data: { serverId: createdServer.id, name: 'KÊNH CHAT', position: 0 } })
      await transaction.channel.createMany({ data: [
        { serverId: createdServer.id, categoryId: category.id, name: 'general', type: 'TEXT', position: 0 },
        { serverId: createdServer.id, categoryId: category.id, name: 'voice', type: 'VOICE', position: 1 },
        { serverId: createdServer.id, categoryId: category.id, name: 'video', type: 'VIDEO', position: 2 },
      ] })
      return createdServer.id
    })
    const createdServer = await prisma.server.findUniqueOrThrow({
      where: { id: serverId },
      include: { categories: { orderBy: { position: 'asc' } }, channels: { orderBy: { position: 'asc' } } },
    })
    return reply.status(201).send({ statusCode: 201, data: { server: toServerDetail(createdServer) } })
  })

  server.get<{ Params: { serverId: string } }>('/:serverId', async (request, reply) => {
    const serverRecord = await prisma.server.findFirst({
      where: { id: request.params.serverId, members: { some: { userId: request.user.id, isBanned: false } } },
      include: { categories: { orderBy: { position: 'asc' } }, channels: { orderBy: { position: 'asc' } } },
    })
    if (!serverRecord) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    return reply.send({ statusCode: 200, data: toServerDetail(serverRecord) })
  })

  server.patch<{ Params: { serverId: string } }>('/:serverId', async (request, reply) => {
    const parsed = z.object({ name: z.string().trim().min(2).max(100).optional(), description: z.string().trim().max(500).nullable().optional() }).strict().safeParse(request.body)
    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) return reply.status(400).send({ statusCode: 400, message: 'Thông tin cập nhật không hợp lệ.' })
    const current = await prisma.server.findFirst({ where: { id: request.params.serverId, members: { some: { userId: request.user.id, isBanned: false, isOwner: true } } }, select: { id: true } })
    if (!current) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền chỉnh sửa.' })
    const serverId = current.id
    const updated = await prisma.$transaction(async (transaction) => {
      await transaction.server.update({ where: { id: serverId }, data: parsed.data })
      return transaction.server.findUniqueOrThrow({ where: { id: serverId }, include: { categories: { orderBy: { position: 'asc' } }, channels: { orderBy: { position: 'asc' } } } })
    })
    return reply.send({ statusCode: 200, data: { server: toServerDetail(updated) } })
  })

  // The server detail endpoint is deliberately small. The member panel loads this
  // separately so large communities can paginate members without inflating READY.
  server.get<{ Params: { serverId: string } }>('/:serverId/members', async (request, reply) => {
    const membership = await prisma.serverMember.findFirst({
      where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false },
      select: { id: true },
    })
    if (!membership) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    const members = await prisma.serverMember.findMany({
      where: { serverId: request.params.serverId, isBanned: false },
      orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }],
      take: 500,
      select: { isOwner: true, roles: { select: { role: { select: { name: true } } } }, user: { select: { id: true, username: true, displayName: true, avatarKey: true, status: true, customStatus: true, isBot: true } } },
    })
    return reply.send({ statusCode: 200, data: { members: members.map(({ isOwner, user }) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: mediaUrl(user.avatarKey),
      status: user.status,
      customStatus: user.customStatus,
      role: isOwner ? 'OWNER' as const : user.isBot ? 'BOT' as const : roles.some(({ role }) => ['ADMIN', 'MODERATOR'].includes(role.name.toUpperCase())) ? 'ADMIN' as const : 'MEMBER' as const,
    })) } })
  })

  server.delete<{ Params: { serverId: string } }>('/:serverId/members/@me', async (request, reply) => {
    const membership = await prisma.serverMember.findFirst({ where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false }, select: { id: true, isOwner: true } })
    if (!membership) return reply.status(404).send({ statusCode: 404, message: 'Bạn không còn là thành viên của server này.' })
    if (membership.isOwner) return reply.status(409).send({ statusCode: 409, message: 'Chủ server cần chuyển quyền sở hữu trước khi rời server.' })
    await prisma.serverMember.delete({ where: { id: membership.id } })
    revokeServerMembership(request.params.serverId, request.user.id)
    return reply.send({ statusCode: 200, data: { serverId: request.params.serverId } })
  })

  server.post<{ Params: { serverId: string }; Body: { name: string; type?: 'TEXT' | 'VOICE' | 'VIDEO'; categoryId?: string } }>('/:serverId/channels', async (request, reply) => {
    const parsed = z.object({ name: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/), type: z.enum(['TEXT', 'VOICE', 'VIDEO']).default('TEXT'), categoryId: z.string().optional() }).safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, message: 'Tên hoặc loại kênh không hợp lệ.' })
    const membership = await prisma.serverMember.findFirst({ where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false }, select: { isOwner: true } })
    if (!membership) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    if (!membership.isOwner) return reply.status(403).send({ statusCode: 403, message: 'Chỉ chủ server mới có thể tạo kênh.' })
    const category = parsed.data.categoryId
      ? await prisma.channelCategory.findFirst({ where: { id: parsed.data.categoryId, serverId: request.params.serverId }, select: { id: true } })
      : await prisma.channelCategory.findFirst({ where: { serverId: request.params.serverId }, orderBy: { position: 'asc' }, select: { id: true } })
    if (!category) return reply.status(400).send({ statusCode: 400, message: 'Không tìm thấy danh mục kênh.' })
    const position = await prisma.channel.count({ where: { serverId: request.params.serverId, categoryId: category.id } })
    const channel = await prisma.channel.create({ data: { serverId: request.params.serverId, categoryId: category.id, name: parsed.data.name, type: parsed.data.type, position } })
    return reply.status(201).send({ statusCode: 201, data: { channel } })
  })

  server.post<{ Params: { serverId: string } }>('/:serverId/invites', { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } }, async (request, reply) => {
    const membership = await prisma.serverMember.findFirst({ where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false }, select: { id: true } })
    if (!membership) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    const { randomBytes } = await import('node:crypto')
    const invite = await prisma.serverInvite.create({ data: { code: randomBytes(5).toString('base64url'), serverId: request.params.serverId, creatorId: request.user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, select: { code: true, expiresAt: true } })
    return reply.status(201).send({ statusCode: 201, data: { invite } })
  })
}
