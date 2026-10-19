import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../config/prisma'

const createSchema = z.object({ name: z.string().trim().min(2).max(100) })

type ServerDetailRecord = Prisma.ServerGetPayload<{ include: { categories: true; channels: true } }>

function toServerDetail(server: ServerDetailRecord) {
  return {
    id: server.id,
    name: server.name,
    iconUrl: null,
    bannerUrl: null,
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
      include: { server: { select: { id: true, name: true } } },
      orderBy: { joinedAt: 'asc' },
    })
    return reply.send({ statusCode: 200, data: memberships.map(({ server: item }) => ({ id: item.id, name: item.name, iconUrl: null, hasUnread: false, mentionCount: 0 })) })
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
}
