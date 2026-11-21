import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { revokeServerChannelAccess, revokeServerMembership } from './websocket.routes'
import { revokeVoiceSessions } from '../services/voice-security'
import {
  bitmaskToPermissions,
  ensureDefaultServerRoles,
  getMemberPermissions,
  hexToRgbInt,
  invalidateServerPermissionsCache,
  permissionsToBitmask,
  rgbIntToHex,
  writeAuditLog,
  type PermissionKey,
} from '../services/permissions'

const permissionsRecordSchema = z.record(z.string(), z.boolean())

export async function roleRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)

  // GET /api/servers/:serverId/roles
  server.get<{ Params: { serverId: string } }>('/:serverId/roles', async (request, reply) => {
    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
    }

    const ownerMember = await prisma.serverMember.findFirst({
      where: { serverId: request.params.serverId, isOwner: true },
      select: { id: true },
    })
    await ensureDefaultServerRoles(prisma, request.params.serverId, ownerMember?.id)

    const roles = await prisma.role.findMany({
      where: { serverId: request.params.serverId },
      orderBy: [{ position: 'desc' }, { createdAt: 'asc' }],
      include: { _count: { select: { members: true } } },
    })

    return reply.send({
      statusCode: 200,
      data: {
        roles: roles.map((r) => ({
          id: r.id,
          serverId: r.serverId,
          name: r.name,
          color: rgbIntToHex(r.color),
          position: r.position,
          permissions: bitmaskToPermissions(r.permissions),
          isManaged: r.isManaged,
          memberCount: r._count.members,
        })),
      },
    })
  })

  // POST /api/servers/:serverId/roles
  server.post<{ Params: { serverId: string } }>('/:serverId/roles', async (request, reply) => {
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(100),
        color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default('#087CFA'),
        permissions: permissionsRecordSchema.optional(),
      })
      .safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, message: 'Dữ liệu vai trò không hợp lệ.' })
    }

    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
    if (!perms.hasPermission('manage_roles')) {
      return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền tạo vai trò.' })
    }

    const rawMask = Number(
      permissionsToBitmask((parsed.data.permissions ?? {}) as Partial<Record<PermissionKey, boolean>>)
    )
    if (!perms.isOwner && (perms.mask & rawMask) !== rawMask) {
      return reply.status(403).send({
        statusCode: 403,
        message: 'Bạn không thể cấp quyền hạn mà vai trò của bạn không có.',
      })
    }
    const mask = BigInt(rawMask)
    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          serverId: request.params.serverId,
          name: parsed.data.name,
          color: hexToRgbInt(parsed.data.color),
          position: 10,
          permissions: mask,
        },
      })
      await writeAuditLog(
        tx,
        request.params.serverId,
        request.user.id,
        'ROLE_CREATE',
        'ROLE',
        created.id,
        `Tạo vai trò "${created.name}"`
      )
      return created
    })

    return reply.status(201).send({
      statusCode: 201,
      data: {
        role: {
          id: role.id,
          serverId: role.serverId,
          name: role.name,
          color: rgbIntToHex(role.color),
          position: role.position,
          permissions: bitmaskToPermissions(role.permissions),
          isManaged: role.isManaged,
          memberCount: 0,
        },
      },
    })
  })

  // PATCH /api/servers/:serverId/roles/:roleId
  server.patch<{ Params: { serverId: string; roleId: string } }>(
    '/:serverId/roles/:roleId',
    async (request, reply) => {
      const parsed = z
        .object({
          name: z.string().trim().min(1).max(100).optional(),
          color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          permissions: permissionsRecordSchema.optional(),
        })
        .strict()
        .safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ statusCode: 400, message: 'Dữ liệu cập nhật vai trò không hợp lệ.' })
      }

      const perms = await getMemberPermissions(request.params.serverId, request.user.id)
      if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
      if (!perms.hasPermission('manage_roles')) {
        return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền sửa vai trò.' })
      }

      const existing = await prisma.role.findFirst({
        where: { id: request.params.roleId, serverId: request.params.serverId },
      })
      if (!existing) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy vai trò.' })
      if (!perms.isOwner && existing.position >= perms.highestRolePosition) {
        return reply.status(403).send({
          statusCode: 403,
          message: 'Bạn không thể chỉnh sửa vai trò có cấp bậc ngang bằng hoặc cao hơn vai trò của bạn.',
        })
      }
      if (!perms.isOwner && parsed.data.permissions !== undefined) {
        const nextMask = Number(
          permissionsToBitmask(
            parsed.data.permissions as Partial<Record<PermissionKey, boolean>>
          )
        )
        const currentMask = Number(existing.permissions)
        const addedBits = nextMask & ~currentMask
        if ((perms.mask & addedBits) !== addedBits) {
          return reply.status(403).send({
            statusCode: 403,
            message: 'Bạn không thể cấp thêm quyền hạn mà vai trò của bạn không có.',
          })
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const next = await tx.role.update({
          where: { id: existing.id },
          data: {
            ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
            ...(parsed.data.color !== undefined ? { color: hexToRgbInt(parsed.data.color) } : {}),
            ...(parsed.data.permissions !== undefined
              ? {
                  permissions: BigInt(
                    permissionsToBitmask(
                      parsed.data.permissions as Partial<Record<PermissionKey, boolean>>
                    )
                  ),
                }
              : {}),
          },
          include: { _count: { select: { members: true } } },
        })
        await writeAuditLog(
          tx,
          request.params.serverId,
          request.user.id,
          'ROLE_UPDATE',
          'ROLE',
          existing.id,
          `Cập nhật vai trò "${next.name}"`
        )
        return next
      })
      invalidateServerPermissionsCache?.(request.params.serverId)
      revokeServerChannelAccess?.(request.params.serverId)

      return reply.send({
        statusCode: 200,
        data: {
          role: {
            id: updated.id,
            serverId: updated.serverId,
            name: updated.name,
            color: rgbIntToHex(updated.color),
            position: updated.position,
            permissions: bitmaskToPermissions(updated.permissions),
            isManaged: updated.isManaged,
            memberCount: updated._count.members,
          },
        },
      })
    }
  )

  // DELETE /api/servers/:serverId/roles/:roleId
  server.delete<{ Params: { serverId: string; roleId: string } }>(
    '/:serverId/roles/:roleId',
    async (request, reply) => {
      const perms = await getMemberPermissions(request.params.serverId, request.user.id)
      if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
      if (!perms.hasPermission('manage_roles')) {
        return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền xóa vai trò.' })
      }

      const existing = await prisma.role.findFirst({
        where: { id: request.params.roleId, serverId: request.params.serverId },
      })
      if (!existing) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy vai trò.' })
      if (!perms.isOwner && existing.position >= perms.highestRolePosition) {
        return reply.status(403).send({
          statusCode: 403,
          message: 'Bạn không thể chỉnh sửa vai trò có cấp bậc ngang bằng hoặc cao hơn vai trò của bạn.',
        })
      }
      if (existing.isManaged) {
        return reply.status(409).send({ statusCode: 409, message: 'Không thể xóa vai trò hệ thống mặc định.' })
      }

      await prisma.$transaction(async (tx) => {
        await tx.role.delete({ where: { id: existing.id } })
        await writeAuditLog(
          tx,
          request.params.serverId,
          request.user.id,
          'ROLE_DELETE',
          'ROLE',
          existing.id,
          `Xóa vai trò "${existing.name}"`
        )
      })
      invalidateServerPermissionsCache?.(request.params.serverId)
      revokeServerChannelAccess?.(request.params.serverId)
      return reply.send({ statusCode: 200, data: { roleId: existing.id } })
    }
  )

  // PUT /api/servers/:serverId/members/:userId/roles
  server.put<{ Params: { serverId: string; userId: string } }>(
    '/:serverId/members/:userId/roles',
    async (request, reply) => {
      const parsed = z.object({ roleIds: z.array(z.string()) }).safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ statusCode: 400, message: 'Danh sách vai trò không hợp lệ.' })
      }

      const perms = await getMemberPermissions(request.params.serverId, request.user.id)
      if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
      if (!perms.hasPermission('manage_roles')) {
        return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền gán vai trò.' })
      }

      const targetMember = await prisma.serverMember.findFirst({
        where: { serverId: request.params.serverId, userId: request.params.userId, isBanned: false },
        include: { roles: { include: { role: { select: { position: true } } } } },
      })
      if (!targetMember) {
        return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy thành viên.' })
      }
      const targetHighest = targetMember.isOwner
        ? 1000
        : Math.max(0, ...targetMember.roles.map((mr) => mr.role.position))
      if (!perms.isOwner && targetHighest >= perms.highestRolePosition) {
        return reply.status(403).send({
          statusCode: 403,
          message: 'Bạn không thể thay đổi vai trò của thành viên có cấp bậc ngang bằng hoặc cao hơn bạn.',
        })
      }

      if (!perms.isOwner && parsed.data.roleIds.length > 0) {
        const requestedRoles = await prisma.role.findMany({
          where: { serverId: request.params.serverId, id: { in: parsed.data.roleIds } },
          select: { position: true },
        })
        if (requestedRoles.some((r) => r.position >= perms.highestRolePosition)) {
          return reply.status(403).send({
            statusCode: 403,
            message: 'Bạn không thể gán vai trò có cấp bậc ngang bằng hoặc cao hơn vai trò của bạn.',
          })
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.memberRole.deleteMany({ where: { memberId: targetMember.id } })
        if (parsed.data.roleIds.length > 0) {
          const validRoles = await tx.role.findMany({
            where: { serverId: request.params.serverId, id: { in: parsed.data.roleIds } },
            select: { id: true },
          })
          if (validRoles.length > 0) {
            await tx.memberRole.createMany({
              data: validRoles.map((r) => ({ memberId: targetMember.id, roleId: r.id })),
            })
          }
        }
        await writeAuditLog(
          tx,
          request.params.serverId,
          request.user.id,
          'MEMBER_ROLES_UPDATE',
          'MEMBER',
          request.params.userId,
          `Cập nhật vai trò cho thành viên`
        )
      })
      invalidateServerPermissionsCache?.(request.params.serverId)
      revokeServerChannelAccess?.(request.params.serverId)
      await revokeVoiceSessions(request.params.userId, undefined, request.params.serverId)

      return reply.send({ statusCode: 200, data: { userId: request.params.userId, roleIds: parsed.data.roleIds } })
    }
  )

  // POST /api/servers/:serverId/members/:userId/kick
  server.post<{ Params: { serverId: string; userId: string } }>(
    '/:serverId/members/:userId/kick',
    async (request, reply) => {
      const perms = await getMemberPermissions(request.params.serverId, request.user.id)
      if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
      if (!perms.hasPermission('kick_members')) {
        return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền mời thành viên ra khỏi máy chủ.' })
      }

      const target = await prisma.serverMember.findFirst({
        where: { serverId: request.params.serverId, userId: request.params.userId, isBanned: false },
        include: { roles: { include: { role: { select: { position: true } } } } },
      })
      if (!target) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy thành viên.' })
      if (target.isOwner) return reply.status(409).send({ statusCode: 409, message: 'Không thể kick chủ sở hữu máy chủ.' })
      const targetKickHighest = Math.max(0, ...target.roles.map((mr) => mr.role.position))
      if (!perms.isOwner && targetKickHighest >= perms.highestRolePosition) {
        return reply.status(403).send({
          statusCode: 403,
          message: 'Bạn không thể mời thành viên có cấp bậc ngang bằng hoặc cao hơn bạn ra khỏi máy chủ.',
        })
      }

      await prisma.$transaction(async (tx) => {
        await tx.serverMember.delete({ where: { id: target.id } })
        await writeAuditLog(
          tx,
          request.params.serverId,
          request.user.id,
          'MEMBER_KICK',
          'MEMBER',
          request.params.userId,
          `Mời thành viên rời khỏi máy chủ`
        )
      })
      revokeServerMembership(request.params.serverId, request.params.userId)
      await revokeVoiceSessions(request.params.userId, undefined, request.params.serverId)
      return reply.send({ statusCode: 200, data: { userId: request.params.userId } })
    }
  )

  // POST /api/servers/:serverId/members/:userId/ban
  server.post<{ Params: { serverId: string; userId: string } }>(
    '/:serverId/members/:userId/ban',
    async (request, reply) => {
      const parsed = z.object({ reason: z.string().trim().max(300).optional() }).safeParse(request.body ?? {})
      const perms = await getMemberPermissions(request.params.serverId, request.user.id)
      if (!perms) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
      if (!perms.hasPermission('ban_members')) {
        return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền chặn thành viên.' })
      }

      const target = await prisma.serverMember.findFirst({
        where: { serverId: request.params.serverId, userId: request.params.userId },
        include: { roles: { include: { role: { select: { position: true } } } } },
      })
      if (!target) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy thành viên.' })
      if (target.isOwner) return reply.status(409).send({ statusCode: 409, message: 'Không thể chặn chủ sở hữu máy chủ.' })
      const targetBanHighest = Math.max(0, ...target.roles.map((mr) => mr.role.position))
      if (!perms.isOwner && targetBanHighest >= perms.highestRolePosition) {
        return reply.status(403).send({
          statusCode: 403,
          message: 'Bạn không thể chặn thành viên có cấp bậc ngang bằng hoặc cao hơn bạn.',
        })
      }

      await prisma.$transaction(async (tx) => {
        await tx.serverMember.update({
          where: { id: target.id },
          data: { isBanned: true, banReason: parsed.success ? parsed.data.reason ?? null : null },
        })
        await writeAuditLog(
          tx,
          request.params.serverId,
          request.user.id,
          'MEMBER_BAN',
          'MEMBER',
          request.params.userId,
          `Chặn thành viên khỏi máy chủ`
        )
      })
      revokeServerMembership(request.params.serverId, request.params.userId)
      await revokeVoiceSessions(request.params.userId, undefined, request.params.serverId)
      return reply.send({ statusCode: 200, data: { userId: request.params.userId } })
    }
  )
}
