import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
import { getMemberPermissions } from '../services/permissions'

export async function analyticsRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)

  // GET /api/servers/:serverId/analytics
  // Thực hiện các truy vấn tổng hợp CSDL: JOIN, GROUP BY, COUNT, SUM, Window Function RANK()
  server.get<{ Params: { serverId: string } }>('/:serverId/analytics', async (request, reply) => {
    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
    }

    const serverId = request.params.serverId
    const canViewAllPrivate = perms.isOwner || perms.hasPermission('access_private_channels')
    const visibleChannelPredicate = Prisma.sql`(
      c.is_private = false
      OR ${canViewAllPrivate} = true
      OR EXISTS (
        SELECT 1 FROM channel_role_permissions crp
        JOIN member_roles mr ON mr.role_id = crp.role_id
        JOIN server_members sm ON sm.id = mr.member_id
        WHERE crp.channel_id = c.id
          AND crp.can_view = true
          AND sm.server_id = ${serverId}
          AND sm.user_id = ${request.user.id}
          AND sm.is_banned = false
      )
    )`

    const [summaryRows, messagesByChannel, topContributors, attachmentsByType] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          totalMembers: number
          onlineMembers: number
          totalChannels: number
          privateChannels: number
          totalMessages: number
          totalAttachments: number
          totalAttachmentBytes: number
        }>
      >`
        SELECT
          (SELECT COUNT(*)::int FROM server_members sm WHERE sm.server_id = ${serverId} AND sm.is_banned = false) AS "totalMembers",
          (SELECT COUNT(*)::int FROM server_members sm JOIN users u ON u.id = sm.user_id WHERE sm.server_id = ${serverId} AND sm.is_banned = false AND u.status = 'ONLINE') AS "onlineMembers",
          (SELECT COUNT(*)::int FROM channels c WHERE c.server_id = ${serverId} AND ${visibleChannelPredicate}) AS "totalChannels",
          (SELECT COUNT(*)::int FROM channels c WHERE c.server_id = ${serverId} AND c.is_private = true AND ${visibleChannelPredicate}) AS "privateChannels",
          (SELECT COUNT(*)::int FROM messages m JOIN channels c ON c.id = m.channel_id WHERE c.server_id = ${serverId} AND m.is_deleted = false AND ${visibleChannelPredicate}) AS "totalMessages",
          (SELECT COUNT(*)::int FROM attachments a JOIN messages m ON m.id = a.message_id JOIN channels c ON c.id = m.channel_id WHERE c.server_id = ${serverId} AND m.is_deleted = false AND ${visibleChannelPredicate}) AS "totalAttachments",
          (SELECT COALESCE(SUM(a.size), 0)::bigint::int FROM attachments a JOIN messages m ON m.id = a.message_id JOIN channels c ON c.id = m.channel_id WHERE c.server_id = ${serverId} AND m.is_deleted = false AND ${visibleChannelPredicate}) AS "totalAttachmentBytes"
      `,
      prisma.$queryRaw<
        Array<{
          channelId: string
          channelName: string
          channelType: string
          isPrivate: boolean
          messageCount: number
          lastMessageAt: Date | null
        }>
      >`
        SELECT
          c.id AS "channelId",
          c.name AS "channelName",
          c.type::text AS "channelType",
          c.is_private AS "isPrivate",
          COUNT(m.id)::int AS "messageCount",
          MAX(m.created_at) AS "lastMessageAt"
        FROM channels c
        LEFT JOIN messages m ON m.channel_id = c.id AND m.is_deleted = false
        WHERE c.server_id = ${serverId}
          AND ${visibleChannelPredicate}
        GROUP BY c.id, c.name, c.type, c.is_private
        ORDER BY "messageCount" DESC, c.position ASC
      `,
      prisma.$queryRaw<
        Array<{
          userId: string
          username: string
          displayName: string | null
          messageCount: number
          rank: number
        }>
      >`
        SELECT
          u.id AS "userId",
          u.username AS "username",
          u.display_name AS "displayName",
          COUNT(m.id)::int AS "messageCount",
          RANK() OVER (ORDER BY COUNT(m.id) DESC)::int AS "rank"
        FROM messages m
        JOIN channels c ON c.id = m.channel_id
        JOIN users u ON u.id = m.author_id
        WHERE c.server_id = ${serverId}
          AND m.is_deleted = false
          AND ${visibleChannelPredicate}
        GROUP BY u.id, u.username, u.display_name
        HAVING COUNT(m.id) > 0
        ORDER BY "messageCount" DESC
        LIMIT 10
      `,
      prisma.$queryRaw<
        Array<{
          type: string
          fileCount: number
          totalBytes: number
        }>
      >`
        SELECT
          a.type::text AS "type",
          COUNT(a.id)::int AS "fileCount",
          COALESCE(SUM(a.size), 0)::bigint::int AS "totalBytes"
        FROM attachments a
        JOIN messages m ON m.id = a.message_id
        JOIN channels c ON c.id = m.channel_id
        WHERE c.server_id = ${serverId}
          AND m.is_deleted = false
          AND ${visibleChannelPredicate}
        GROUP BY a.type
        ORDER BY "totalBytes" DESC
      `,
    ])

    return reply.send({
      statusCode: 200,
      data: {
        summary: summaryRows[0] ?? {
          totalMembers: 0,
          onlineMembers: 0,
          totalChannels: 0,
          privateChannels: 0,
          totalMessages: 0,
          totalAttachments: 0,
          totalAttachmentBytes: 0,
        },
        messagesByChannel: messagesByChannel.map((row) => ({
          ...row,
          lastMessageAt: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
        })),
        topContributors,
        attachmentsByType,
      },
    })
  })

  // GET /api/servers/:serverId/search/messages?q=...&channelId=...
  // Tìm kiếm nội dung tin nhắn — tuyệt đối không trả tin từ kênh riêng tư mà user không có quyền xem
  server.get<{
    Params: { serverId: string }
    Querystring: { q?: string; channelId?: string; limit?: string }
  }>('/:serverId/search/messages', async (request, reply) => {
    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
    }

    const q = (request.query.q ?? '').trim()
    if (!q) {
      return reply.send({ statusCode: 200, data: { results: [] } })
    }
    const escapedQ = q.replace(/[\\%_]/g, '\\$&')
    const pattern = `%${escapedQ}%`
    const limit = Math.min(Math.max(Number(request.query.limit) || 25, 1), 50)
    const channelFilter = request.query.channelId
      ? Prisma.sql`AND c.id = ${request.query.channelId}`
      : Prisma.empty

    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        channelId: string
        channelName: string
        content: string | null
        createdAt: Date
        authorId: string
        authorUsername: string
        authorDisplayName: string | null
      }>
    >`
      SELECT
        m.id,
        c.id AS "channelId",
        c.name AS "channelName",
        m.content,
        m.created_at AS "createdAt",
        u.id AS "authorId",
        u.username AS "authorUsername",
        u.display_name AS "authorDisplayName"
      FROM messages m
      JOIN channels c ON c.id = m.channel_id
      JOIN users u ON u.id = m.author_id
      WHERE c.server_id = ${request.params.serverId}
        AND m.is_deleted = false
        AND m.content ILIKE ${pattern} ESCAPE '\'
        ${channelFilter}
        AND (
          c.is_private = false
          OR ${perms.isOwner} = true
          OR ${perms.hasPermission('access_private_channels')} = true
          OR EXISTS (
            SELECT 1 FROM channel_role_permissions crp
            JOIN member_roles mr ON mr.role_id = crp.role_id
            JOIN server_members sm ON sm.id = mr.member_id
            WHERE crp.channel_id = c.id
              AND crp.can_view = true
              AND sm.server_id = ${request.params.serverId}
              AND sm.user_id = ${request.user.id}
              AND sm.is_banned = false
          )
        )
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `

    return reply.send({
      statusCode: 200,
      data: {
        results: rows.map((row) => ({
          id: row.id,
          channelId: row.channelId,
          channelName: row.channelName,
          content: row.content,
          createdAt: row.createdAt.toISOString(),
          author: {
            id: row.authorId,
            username: row.authorUsername,
            displayName: row.authorDisplayName,
          },
        })),
      },
    })
  })

  // GET /api/servers/:serverId/audit-logs
  server.get<{ Params: { serverId: string } }>('/:serverId/audit-logs', async (request, reply) => {
    const perms = await getMemberPermissions(request.params.serverId, request.user.id)
    if (!perms) {
      return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy máy chủ.' })
    }
    if (!perms.hasPermission('view_audit_log')) {
      return reply.status(403).send({ statusCode: 403, message: 'Bạn không có quyền xem nhật ký hoạt động.' })
    }

    const logs = await prisma.auditLog.findMany({
      where: { serverId: request.params.serverId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: { id: true, username: true, displayName: true } },
      },
    })

    return reply.send({
      statusCode: 200,
      data: {
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          detail: log.detail,
          createdAt: log.createdAt.toISOString(),
          actor: log.actor,
        })),
      },
    })
  })
}
