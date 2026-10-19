import type { FastifyInstance } from 'fastify'
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import { verifyUploadedObject } from './upload.routes'
import { publishChannelMessage } from './websocket.routes'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'

const attachmentInput = z.object({ filename: z.string().trim().min(1).max(255), contentType: z.string(), key: z.string() })
const messageInput = z.object({ content: z.string().trim().max(2000).default(''), attachments: z.array(attachmentInput).max(10).default([]) })

async function canAccessChannel(channelId: string, userId: string) {
  return prisma.channel.findFirst({
    where: { id: channelId, server: { members: { some: { userId, isBanned: false } } } },
    select: { id: true, name: true, type: true, serverId: true, userLimit: true },
  })
}

async function presentMessage(fastify: FastifyInstance, message: any) {
  const attachments = await Promise.all(message.attachments.map(async (attachment: any) => {
    const url = await getSignedUrl(fastify.r2.s3, new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: attachment.r2Key,
      ResponseContentDisposition: `inline; filename="${attachment.filename.replace(/["\\\r\n]/g, '_')}"`,
      ResponseContentType: attachment.contentType,
    }), { expiresIn: 300 })
    return { id: attachment.id, filename: attachment.filename, contentType: attachment.contentType, size: attachment.size, type: attachment.type, url, expiresIn: 300 }
  }))
  return {
    id: message.id,
    channelId: message.channelId,
    content: message.content ?? '',
    createdAt: message.createdAt,
    author: { id: message.author.id, username: message.author.username, displayName: message.author.displayName },
    user: message.author.displayName || message.author.username,
    avatar: (message.author.displayName || message.author.username).slice(0, 2).toUpperCase(),
    time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    attachments,
  }
}

export async function channelRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)

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
      include: { author: { select: { id: true, username: true, displayName: true } }, attachments: true },
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
        content: parsed.data.content || null,
        attachments: { create: verified.map(({ input, object, permanentKey }) => ({
          filename: input.filename,
          contentType: object!.contentType,
          size: object!.size,
          r2Key: permanentKey,
          type: input.contentType.startsWith('image/') ? 'IMAGE' : input.contentType.startsWith('video/') ? 'VIDEO' : input.contentType.startsWith('audio/') ? 'AUDIO' : 'FILE',
        })) },
      },
      include: { author: { select: { id: true, username: true, displayName: true } }, attachments: true },
      })
    } catch (error) {
      await Promise.all(verified.map(({ permanentKey }) => server.r2.s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: permanentKey })).catch(() => undefined)))
      throw error
    }
    await Promise.all(verified.map(({ input }) => server.r2.s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: input.key })).catch(() => undefined)))
    const presented = await presentMessage(server, message)
    publishChannelMessage(channel.id, presented)
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
  server.get('/', async (_, reply) => reply.send({ statusCode: 200, data: [] }))
}
