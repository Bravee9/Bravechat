import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import { verifyUploadedObject } from './upload.routes'
import { publishChannelMessage, publishUserEvent } from './websocket.routes'
import { dmInclude, fail, messageInclude, pairFilter, serializeMessage, serializable, friendshipPair } from '../services/conversation'
import { messageActionRoutes } from './message-action.routes'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'

const attachmentInput = z.object({ filename: z.string().trim().min(1).max(255), contentType: z.string(), key: z.string() })
const messageInput = z.object({ content: z.string().trim().max(2000).default(''), attachments: z.array(attachmentInput).max(10).default([]), nonce: z.string().uuid().optional(), replyToId: z.string().min(1).optional() })

async function canAccessChannel(channelId: string, userId: string) {
  return prisma.channel.findFirst({
    where: { id: channelId, server: { members: { some: { userId, isBanned: false } } } },
    select: { id: true, name: true, type: true, serverId: true, userLimit: true },
  })
}

const presentMessage = serializeMessage

export async function channelRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)
  server.post<{ Params: { channelId: string } }>('/:channelId/read', async (request) => {
    const channel = await canAccessChannel(request.params.channelId, request.user.id)
    if (!channel) throw fail(404, 'Không tìm thấy kênh hoặc bạn không có quyền truy cập.')
    const now = new Date()
    // Hai thiết bị ACK lệch thứ tự không được đưa mốc đọc quay ngược về quá khứ.
    await prisma.$executeRaw`INSERT INTO channel_read_states (user_id, channel_id, last_read_at) VALUES (${request.user.id}, ${channel.id}, ${now})
      ON CONFLICT (user_id, channel_id) DO UPDATE SET last_read_at = GREATEST(channel_read_states.last_read_at, EXCLUDED.last_read_at)`
    publishUserEvent(request.user.id, { type: 'channel_read', channelId: channel.id, serverId: channel.serverId })
    return { statusCode: 200, data: null }
  })

  server.get<{ Params: { channelId: string }; Querystring: { before?: string; limit?: string } }>('/:channelId/messages', async (request, reply) => {
    const channel = await canAccessChannel(request.params.channelId, request.user.id)
    if (!channel) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy channel hoặc bạn không có quyền truy cập.' })
    const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 100)
    let before: Date | undefined
    if (request.query.before) {
      const cursor = await prisma.message.findFirst({ where: { id: request.query.before, channelId: channel.id }, select: { createdAt: true } })
      if (!cursor) return reply.status(400).send({ statusCode: 400, message: 'Cursor không hợp lệ.' })
      before = cursor.createdAt
    }
    const messages = await prisma.message.findMany({
      where: {
        channelId: channel.id,
        isDeleted: false,
        ...(before ? { OR: [
          { createdAt: { lt: before } },
          { createdAt: before, id: { lt: request.query.before } },
        ] } : {}),
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: messageInclude,
    })
    const hasMore = messages.length > limit
    const page = messages.slice(0, limit).reverse()
    return reply.send({ statusCode: 200, data: { messages: await Promise.all(page.map((message) => presentMessage(server, message))), hasMore, nextCursor: page[0]?.id ?? null } })
  })

  server.post<{ Params: { channelId: string } }>('/:channelId/messages', async (request, reply) => {
    const channel = await canAccessChannel(request.params.channelId, request.user.id)
    if (!channel) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy channel hoặc bạn không có quyền truy cập.' })
    const parsed = messageInput.safeParse(request.body)
    if (!parsed.success || (!parsed.data.content && parsed.data.attachments.length === 0)) {
      return reply.status(400).send({ statusCode: 400, message: 'Tin nhắn cần có nội dung hoặc tệp đính kèm.', details: parsed.success ? undefined : parsed.error.flatten().fieldErrors })
    }
    const findExisting = () => prisma.message.findFirst({ where: { channelId: channel.id, authorId: request.user.id, nonce: parsed.data.nonce }, include: messageInclude })
    // Kiểm nonce trước xử lý upload để retry không tạo tin hoặc tiêu thụ file pending lần nữa.
    if (parsed.data.nonce) {
      const existing = await findExisting()
      if (existing) {
        if ((existing.content ?? '') !== parsed.data.content || existing.replyToId !== (parsed.data.replyToId ?? null)) throw fail(409, 'Mã gửi tin đã được dùng cho nội dung khác.')
        return reply.send({ statusCode: 200, data: { message: await presentMessage(server, existing) } })
      }
    }
    if (parsed.data.replyToId && !await prisma.message.findFirst({ where: { id: parsed.data.replyToId, channelId: channel.id, isDeleted: false }, select: { id: true } })) throw fail(400, 'Tin nhắn được trả lời không thuộc kênh này hoặc đã bị xóa.')
    const keys = parsed.data.attachments.map((attachment) => attachment.key)
    if (new Set(keys).size !== keys.length) return reply.status(400).send({ statusCode: 400, message: 'Không thể đính kèm cùng một file nhiều lần.' })
    const verified = await Promise.all(parsed.data.attachments.map(async (attachment) => ({
      input: attachment,
      object: await verifyUploadedObject(server, attachment.key, request.user.id, attachment.contentType),
      permanentKey: `attachments/${channel.id}/${randomUUID()}${extname(attachment.filename).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 12)}`,
    })))
    if (verified.some(({ object }) => !object)) return reply.status(400).send({ statusCode: 400, message: 'Một hoặc nhiều file chưa upload xong hoặc không hợp lệ.' })
    try {
      await Promise.all(verified.map(({ input, permanentKey }) => server.r2.s3.send(new CopyObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: permanentKey,
        CopySource: `${env.R2_BUCKET_NAME}/${input.key.split('/').map(encodeURIComponent).join('/')}`,
      }))))
    } catch (error) {
      await Promise.all(verified.map(({ permanentKey }) => server.r2.s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: permanentKey })).catch(() => undefined)))
      request.log.error(error, 'Failed to commit uploaded objects')
      return reply.status(502).send({ statusCode: 502, message: 'Không thể hoàn tất lưu tệp.' })
    }
    let message
    try {
      message = await prisma.message.create({
      data: {
        channelId: channel.id,
        authorId: request.user.id,
        nonce: parsed.data.nonce,
        replyToId: parsed.data.replyToId,
        type: parsed.data.replyToId ? 'REPLY' : 'DEFAULT',
        content: parsed.data.content || null,
        attachments: { create: verified.map(({ input, object, permanentKey }) => ({
          filename: input.filename,
          contentType: object!.contentType,
          size: object!.size,
          r2Key: permanentKey,
          type: input.contentType.startsWith('image/') ? 'IMAGE' : input.contentType.startsWith('video/') ? 'VIDEO' : input.contentType.startsWith('audio/') ? 'AUDIO' : 'FILE',
        })) },
      },
      include: messageInclude,
      })
    } catch (error) {
      await Promise.all(verified.map(({ permanentKey }) => server.r2.s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: permanentKey })).catch(() => undefined)))
      if (parsed.data.nonce && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await findExisting()
        if (existing && (existing.content ?? '') === parsed.data.content && existing.replyToId === (parsed.data.replyToId ?? null)) return reply.send({ statusCode: 200, data: { message: await presentMessage(server, existing) } })
        throw fail(409, 'Mã gửi tin đã được dùng.')
      }
      throw error
    }
    await Promise.all(verified.map(({ input }) => server.r2.s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: input.key })).catch(() => undefined)))
    const presented = await presentMessage(server, message)
    publishChannelMessage(channel.id, presented, channel.serverId)
    return reply.status(201).send({ statusCode: 201, data: { message: presented } })
  })

  server.get<{ Params: { channelId: string } }>('/:channelId', async (request, reply) => {
    const channel = await canAccessChannel(request.params.channelId, request.user.id)
    if (!channel) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy channel hoặc bạn không có quyền truy cập.' })
    return reply.send({ statusCode: 200, data: { channel } })
  })
}


export async function messageRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)
  await server.register(messageActionRoutes)
  server.get<{ Params: { userId: string }; Querystring: { before?: string; limit?: string; read?: string } }>('/dm/:userId', async (request) => {
    const otherId = request.params.userId
    if (otherId === request.user.id || !await prisma.user.findFirst({ where: { id: otherId, isBanned: false }, select: { id: true } })) throw fail(404, 'Không tìm thấy người dùng.')
    const query = z.object({ before: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(50), read: z.enum(['true', 'false']).default('true') }).parse(request.query)
    const pair = pairFilter(request.user.id, otherId)
    const cursor = query.before ? await prisma.directMessage.findFirst({ where: { id: query.before, ...pair }, select: { createdAt: true, id: true } }) : null
    if (query.before && !cursor) throw fail(400, 'Cursor không hợp lệ.')
    const rows = await prisma.directMessage.findMany({ where: { AND: [pair, { isDeleted: false }, ...(cursor ? [{ OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }] : [])] }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit + 1, include: dmInclude })
    // Tải trang cũ hoặc tải nền không có nghĩa người dùng vừa đọc cuộc trò chuyện.
    if (!cursor && query.read === 'true') {
      await prisma.directMessage.updateMany({ where: { senderId: otherId, receiverId: request.user.id, isRead: false }, data: { isRead: true } })
      publishUserEvent(request.user.id, { type: 'conversations_update' })
    }
    const hasMore = rows.length > query.limit
    const page = rows.slice(0, query.limit).reverse()
    return { statusCode: 200, data: { messages: await Promise.all(page.map((row) => serializeMessage(server, row))), hasMore, nextCursor: page[0]?.id ?? null } }
  })
  server.post<{ Params: { userId: string } }>('/dm/:userId', { config: { rateLimit: { max: 300, timeWindow: '1 minute' } } }, async (request, reply) => {
    const input = z.object({ content: z.string().trim().min(1).max(2000), nonce: z.string().uuid().optional(), replyToId: z.string().optional() }).parse(request.body)
    const otherId = request.params.userId
    if (otherId === request.user.id || !await prisma.user.findFirst({ where: { id: otherId, isBanned: false }, select: { id: true } })) throw fail(404, 'Không tìm thấy người dùng.')
    const result = await serializable(async (tx) => {
      if (await tx.friendship.findFirst({ where: { ...friendshipPair(request.user.id, otherId), status: 'BLOCKED' }, select: { id: true } })) throw fail(403, 'Không thể gửi tin nhắn cho người dùng này.')
      if (input.nonce) {
        const existing = await tx.directMessage.findUnique({ where: { senderId_receiverId_nonce: { senderId: request.user.id, receiverId: otherId, nonce: input.nonce } }, include: dmInclude })
        if (existing) {
          if ((existing.content ?? '') !== input.content || existing.replyToId !== (input.replyToId ?? null)) throw fail(409, 'Mã gửi tin đã được dùng cho nội dung khác.')
          return { row: existing, created: false }
        }
      }
      if (input.replyToId && !await tx.directMessage.findFirst({ where: { id: input.replyToId, ...pairFilter(request.user.id, otherId), isDeleted: false }, select: { id: true } })) throw fail(400, 'Không tìm thấy tin nhắn được trả lời trong cuộc trò chuyện này.')
      return { row: await tx.directMessage.create({ data: { senderId: request.user.id, receiverId: otherId, content: input.content, nonce: input.nonce, replyToId: input.replyToId }, include: dmInclude }), created: true }
    })
    const message = await serializeMessage(server, result.row)
    if (result.created) for (const id of [request.user.id, otherId]) publishUserEvent(id, { type: 'dm_create', message, senderId: request.user.id, receiverId: otherId })
    return reply.code(result.created ? 201 : 200).send({ statusCode: result.created ? 201 : 200, data: { message } })
  })
}
