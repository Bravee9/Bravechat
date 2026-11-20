import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { mediaUrl } from '../services/storage.service'
import { revokeServerMembership } from './websocket.routes'
import { revokeVoiceSessions } from '../services/voice-security'
import { unreadActivity, serverActivity, type ChannelActivity } from '../services/read-state'
import {
  ensureDefaultServerRoles,
  getMemberPermissions,
  writeAuditLog,
} from '../services/permissions'

const createSchema = z.object({ name: z.string().trim().min(2).max(100) })

type ServerDetailRecord = Prisma.ServerGetPayload<{
  include: {
    categories: true
    channels: {
      include: {
        rolePermissions: {
          where: { canView: true }
          select: { roleId: true }
        }
      }
    }
  }
}>

function toServerDetail(
  server: ServerDetailRecord,
  activity: ChannelActivity[] = [],
  userPerms?: { isOwner: boolean; roleIds: string[]; canAccessPrivateByPerm: boolean }
) {
  const visibleChannels = server.channels.filter((channel) => {
    if (!channel.isPrivate || !userPerms || userPerms.isOwner) return true
    if (userPerms.canAccessPrivateByPerm) return true
    return channel.rolePermissions.some((rp) => userPerms.roleIds.includes(rp.roleId))
  })

  return {
    id: server.id,
    name: server.name,
    iconUrl: mediaUrl(server.iconKey),
    bannerUrl: mediaUrl(server.bannerKey),
    badgeColor: server.badgeColor,
    isPublic: server.isPublic,
    description: server.description,
    ownerId: server.ownerId,
    categories: server.categories.map((category) => ({
      id: category.id,
      serverId: category.serverId,
      name: category.name,
      position: category.position,
    })),
    channels: visibleChannels.map((channel) => ({
      id: channel.id,
      serverId: channel.serverId,
      categoryId: channel.categoryId,
      name: channel.name,
      type: channel.type,
      topic: channel.topic,
      position: channel.position,
      isPrivate: channel.isPrivate,
      allowedRoleIds: channel.rolePermissions.map((rp) => rp.roleId),
      hasUnread: activity.some((row) => row.channelId === channel.id && row.unreadCount > 0),
      mentionCount: activity.find((row) => row.channelId === channel.id)?.mentionCount ?? 0,
    })),
  }
}

export async function serverRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)

  server.get('/', async (request, reply) => {
    const activity = await unreadActivity(request.user.id)
    const memberships = await prisma.serverMember.findMany({
      where: { userId: request.user.id, isBanned: false },
      include: { server: { select: { id: true, name: true, iconKey: true, badgeColor: true } } },
      orderBy: { joinedAt: 'asc' },
    })
    return reply.send({
      statusCode: 200,
      data: memberships.map(({ server: item }) => ({
        id: item.id,
        name: item.name,
        iconUrl: mediaUrl(item.iconKey),
        badgeColor: item.badgeColor,
        ...serverActivity(activity, item.id),
      })),
    })
  })

  server.post<{ Body: z.infer<typeof createSchema> }>(
    '/',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 hour',
          errorResponseBuilder: () => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Bạn chỉ có thể tạo tối đa 10 máy chủ trong 1 giờ. Vui lòng thử lại sau.',
          }),
        },
      },
    },
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ statusCode: 400, message: 'Tên server cần dài từ 2 đến 100 ký tự.' })
      }

      const ownedCount = await prisma.server.count({ where: { ownerId: request.user.id } })
      if (ownedCount >= 20) {
        return reply.status(403).send({
          statusCode: 403,
          message: 'Bạn đã đạt giới hạn tối đa 20 máy chủ được phép tạo trên một tài khoản.',
        })
      }

      const serverId = await prisma.$transaction(async (transaction) => {
        const createdServer = await transaction.server.create({
          data: { name: parsed.data.name, ownerId: request.user.id },
        })
        const ownerMember = await transaction.serverMember.create({
          data: { userId: request.user.id, serverId: createdServer.id, isOwner: true },
        })
        await ensureDefaultServerRoles(transaction, createdServer.id, ownerMember.id)
        const category = await transaction.channelCategory.create({
          data: { serverId: createdServer.id, name: 'KÊNH CHAT', position: 0 },
        })
        await transaction.channel.createMany({
          data: [
            { serverId: createdServer.id, categoryId: category.id, name: 'general', type: 'TEXT', position: 0 },
            { serverId: createdServer.id, categoryId: category.id, name: 'voice', type: 'VOICE', position: 1 },
            { serverId: createdServer.id, categoryId: category.id, name: 'video', type: 'VIDEO', position: 2 },
          ],
        })
        await writeAuditLog(
          transaction,
          createdServer.id,
          request.user.id,
          'SERVER_CREATE',
          'SERVER',
          createdServer.id,
          `Tạo máy chủ "${parsed.data.name}"`
        )
        return createdServer.id
      })

      const createdServer = await prisma.server.findUniqueOrThrow({
        where: { id: serverId },
        include: {
          categories: { orderBy: { position: 'asc' } },
          channels: {
            orderBy: { position: 'asc' },
            include: { rolePermissions: { where: { canView: true }, select: { roleId: true } } },
          },
        },
      })
      return reply.status(201).send({ statusCode: 201, data: { server: toServerDetail(createdServer) } })
    }
  )

  server.get<{ Params: { serverId: string } }>('/:serverId', async (request, reply) => {
    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    }

    const serverRecord = await prisma.server.findUnique({
      where: { id: request.params.serverId },
      include: {
        categories: { orderBy: { position: 'asc' } },
        channels: {
          orderBy: { position: 'asc' },
          include: { rolePermissions: { where: { canView: true }, select: { roleId: true } } },
        },
      },
    })
    if (!serverRecord) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    }

    return reply.send({
      statusCode: 200,
      data: toServerDetail(serverRecord, await unreadActivity(request.user.id, serverRecord.id), {
        isOwner: perms.isOwner,
        roleIds: perms.roleIds,
        canAccessPrivateByPerm: perms.hasPermission('access_private_channels'),
      }),
    })
  })

  server.patch<{ Params: { serverId: string } }>('/:serverId', async (request, reply) => {
    const parsed = z
      .object({
        name: z.string().trim().min(2).max(100).optional(),
        description: z.string().trim().max(500).nullable().optional(),
        badgeColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
        isPublic: z.boolean().optional(),
      })
      .strict()
      .safeParse(request.body)
    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      return reply.status(400).send({ statusCode: 400, message: 'Thông tin cập nhật không hợp lệ.' })
    }

    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server.' })
    }
    if (!perms.hasPermission('manage_server')) {
      return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền chỉnh sửa máy chủ.' })
    }

    const serverId = request.params.serverId
    const updated = await prisma.$transaction(async (transaction) => {
      await transaction.server.update({ where: { id: serverId }, data: parsed.data })
      await writeAuditLog(
        transaction,
        serverId,
        request.user.id,
        'SERVER_UPDATE',
        'SERVER',
        serverId,
        `Cập nhật thông tin máy chủ (${Object.keys(parsed.data).join(', ')})`
      )
      return transaction.server.findUniqueOrThrow({
        where: { id: serverId },
        include: {
          categories: { orderBy: { position: 'asc' } },
          channels: {
            orderBy: { position: 'asc' },
            include: { rolePermissions: { where: { canView: true }, select: { roleId: true } } },
          },
        },
      })
    })
    return reply.send({
      statusCode: 200,
      data: { server: toServerDetail(updated, await unreadActivity(request.user.id, serverId)) },
    })
  })

  server.delete<{ Params: { serverId: string } }>('/:serverId', async (request, reply) => {
    const membership = await prisma.serverMember.findFirst({
      where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false },
      select: { isOwner: true },
    })
    if (!membership) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
    }
    if (!membership.isOwner) {
      return reply.status(403).send({ statusCode: 403, message: 'Chỉ chủ sở hữu mới có thể xóa máy chủ.' })
    }

    const members = await prisma.serverMember.findMany({
      where: { serverId: request.params.serverId },
      select: { userId: true },
    })
    await prisma.server.delete({ where: { id: request.params.serverId } })
    for (const m of members) {
      revokeServerMembership(request.params.serverId, m.userId)
      await revokeVoiceSessions(m.userId, undefined, request.params.serverId)
    }
    return reply.send({ statusCode: 200, data: { serverId: request.params.serverId } })
  })

  server.get<{ Params: { serverId: string } }>('/:serverId/members', async (request, reply) => {
    const membership = await prisma.serverMember.findFirst({
      where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false },
      select: { id: true },
    })
    if (!membership) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    }
    const members = await prisma.serverMember.findMany({
      where: { serverId: request.params.serverId, isBanned: false },
      orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }],
      take: 500,
      select: {
        isOwner: true,
        roles: { select: { roleId: true, role: { select: { name: true } } } },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarKey: true,
            status: true,
            customStatus: true,
            isBot: true,
          },
        },
      },
    })
    return reply.send({
      statusCode: 200,
      data: {
        members: members.map(({ isOwner, roles, user }) => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: mediaUrl(user.avatarKey),
          status: user.status,
          customStatus: user.customStatus,
          role: isOwner
            ? ('OWNER' as const)
            : user.isBot
            ? ('BOT' as const)
            : roles.some(({ role }) => ['ADMIN', 'MODERATOR'].includes(role.name.toUpperCase()))
            ? ('ADMIN' as const)
            : ('MEMBER' as const),
          roleIds: roles.map((r) => r.roleId),
        })),
      },
    })
  })

  server.delete<{ Params: { serverId: string } }>('/:serverId/members/@me', async (request, reply) => {
    const membership = await prisma.serverMember.findFirst({
      where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false },
      select: { id: true, isOwner: true },
    })
    if (!membership) {
      return reply.status(404).send({ statusCode: 404, message: 'Bạn không còn là thành viên của server này.' })
    }
    if (membership.isOwner) {
      return reply.status(409).send({ statusCode: 409, message: 'Chủ server cần chuyển quyền sở hữu trước khi rời server.' })
    }
    await prisma.serverMember.delete({ where: { id: membership.id } })
    revokeServerMembership(request.params.serverId, request.user.id)
    await revokeVoiceSessions(request.user.id, undefined, request.params.serverId)
    return reply.send({ statusCode: 200, data: { serverId: request.params.serverId } })
  })

  server.post<{
    Params: { serverId: string }
    Body: {
      name: string
      type?: 'TEXT' | 'VOICE' | 'VIDEO'
      categoryId?: string
      isPrivate?: boolean
      allowedRoleIds?: string[]
    }
  }>('/:serverId/channels', async (request, reply) => {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
        type: z.enum(['TEXT', 'VOICE', 'VIDEO']).default('TEXT'),
        categoryId: z.string().optional(),
        isPrivate: z.boolean().default(false),
        allowedRoleIds: z.array(z.string()).default([]),
      })
      .safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, message: 'Tên hoặc loại kênh không hợp lệ.' })
    }

    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
    }
    if (!perms.hasPermission('manage_channels')) {
      return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền tạo kênh.' })
    }

    const totalChannels = await prisma.channel.count({ where: { serverId: request.params.serverId } })
    if (totalChannels >= 50) {
      return reply.status(403).send({ statusCode: 403, message: 'Máy chủ đã đạt giới hạn tối đa 50 kênh.' })
    }
    const category = parsed.data.categoryId
      ? await prisma.channelCategory.findFirst({
          where: { id: parsed.data.categoryId, serverId: request.params.serverId },
          select: { id: true },
        })
      : await prisma.channelCategory.findFirst({
          where: { serverId: request.params.serverId },
          orderBy: { position: 'asc' },
          select: { id: true },
        })
    if (!category) {
      return reply.status(400).send({ statusCode: 400, message: 'Không tìm thấy danh mục kênh.' })
    }
    const position = await prisma.channel.count({
      where: { serverId: request.params.serverId, categoryId: category.id },
    })

    const channel = await prisma.$transaction(async (tx) => {
      const created = await tx.channel.create({
        data: {
          serverId: request.params.serverId,
          categoryId: category.id,
          name: parsed.data.name,
          type: parsed.data.type,
          position,
          isPrivate: parsed.data.isPrivate,
        },
      })
      if (parsed.data.isPrivate && parsed.data.allowedRoleIds.length > 0) {
        const validRoles = await tx.role.findMany({
          where: { serverId: request.params.serverId, id: { in: parsed.data.allowedRoleIds } },
          select: { id: true },
        })
        if (validRoles.length > 0) {
          await tx.channelRolePermission.createMany({
            data: validRoles.map((r) => ({
              channelId: created.id,
              roleId: r.id,
              canView: true,
              canSend: true,
            })),
          })
        }
      }
      await writeAuditLog(
        tx,
        request.params.serverId,
        request.user.id,
        'CHANNEL_CREATE',
        'CHANNEL',
        created.id,
        `Tạo kênh #${created.name}${created.isPrivate ? ' (Riêng tư)' : ''}`
      )
      return created
    })
    return reply.status(201).send({ statusCode: 201, data: { channel } })
  })

  server.patch<{ Params: { serverId: string; channelId: string } }>(
    '/:serverId/channels/:channelId',
    async (request, reply) => {
      const parsed = z
        .object({
          name: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
          topic: z.string().trim().max(1024).nullable().optional(),
          isPrivate: z.boolean().optional(),
          allowedRoleIds: z.array(z.string()).optional(),
        })
        .strict()
        .safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ statusCode: 400, message: 'Dữ liệu cập nhật kênh không hợp lệ.' })
      }

      const perms = await getMemberPermissions(request.params.serverId, request.user.id)
      if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
      if (!perms.hasPermission('manage_channels')) {
        return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền chỉnh sửa kênh.' })
      }

      const existing = await prisma.channel.findFirst({
        where: { id: request.params.channelId, serverId: request.params.serverId },
      })
      if (!existing) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy kênh.' })

      const updated = await prisma.$transaction(async (tx) => {
        const ch = await tx.channel.update({
          where: { id: existing.id },
          data: {
            ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
            ...(parsed.data.topic !== undefined ? { topic: parsed.data.topic } : {}),
            ...(parsed.data.isPrivate !== undefined ? { isPrivate: parsed.data.isPrivate } : {}),
          },
        })
        if (parsed.data.allowedRoleIds !== undefined) {
          await tx.channelRolePermission.deleteMany({ where: { channelId: existing.id } })
          if (parsed.data.allowedRoleIds.length > 0) {
            const validRoles = await tx.role.findMany({
              where: { serverId: request.params.serverId, id: { in: parsed.data.allowedRoleIds } },
              select: { id: true },
            })
            if (validRoles.length > 0) {
              await tx.channelRolePermission.createMany({
                data: validRoles.map((r) => ({
                  channelId: existing.id,
                  roleId: r.id,
                  canView: true,
                  canSend: true,
                })),
              })
            }
          }
        }
        await writeAuditLog(
          tx,
          request.params.serverId,
          request.user.id,
          'CHANNEL_UPDATE',
          'CHANNEL',
          existing.id,
          `Cập nhật kênh #${ch.name} (${ch.isPrivate ? 'Riêng tư' : 'Công khai'})`
        )
        return ch
      })

      return reply.send({ statusCode: 200, data: { channel: updated } })
    }
  )

  server.delete<{ Params: { serverId: string; channelId: string } }>(
    '/:serverId/channels/:channelId',
    async (request, reply) => {
      const perms = await getMemberPermissions(request.params.serverId, request.user.id)
      if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
      if (!perms.hasPermission('manage_channels')) {
        return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền xóa kênh.' })
      }

      const existing = await prisma.channel.findFirst({
        where: { id: request.params.channelId, serverId: request.params.serverId },
      })
      if (!existing) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy kênh.' })

      await prisma.$transaction(async (tx) => {
        await tx.channel.delete({ where: { id: existing.id } })
        await writeAuditLog(
          tx,
          request.params.serverId,
          request.user.id,
          'CHANNEL_DELETE',
          'CHANNEL',
          existing.id,
          `Xóa kênh #${existing.name}`
        )
      })
      return reply.send({ statusCode: 200, data: { channelId: existing.id } })
    }
  )

  server.post<{ Params: { serverId: string } }>(
    '/:serverId/invites',
    { config: { rateLimit: { max: 100, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const membership = await prisma.serverMember.findFirst({
        where: { serverId: request.params.serverId, userId: request.user.id, isBanned: false },
        select: { id: true },
      })
      if (!membership) {
        return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy server hoặc bạn không có quyền truy cập.' })
      }
      const { randomBytes } = await import('node:crypto')
      const invite = await prisma.serverInvite.create({
        data: {
          code: randomBytes(5).toString('base64url'),
          serverId: request.params.serverId,
          creatorId: request.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        select: { code: true, expiresAt: true },
      })
      return reply.status(201).send({ statusCode: 201, data: { invite } })
    }
  )
}
