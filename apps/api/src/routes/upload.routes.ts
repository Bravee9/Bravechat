import type { FastifyPluginAsync } from 'fastify'
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { env } from '../config/env'
import { prisma } from '../config/prisma'

export async function verifyUploadedObject(fastify: import('fastify').FastifyInstance, key: string, userId: string, expectedType: string) {
  if (!key.startsWith(`pending/${userId}/`)) return null
  try {
    const result = await fastify.r2.s3.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }))
    if (!result.ContentLength || result.ContentLength > env.MAX_FILE_SIZE || result.ContentType !== expectedType) return null
    return { size: result.ContentLength, contentType: result.ContentType }
  } catch {
    return null
  }
}

const allowedTypes = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm',
  'application/pdf', 'text/plain', 'application/zip', 'application/octet-stream',
])
const presignSchema = z.object({
  channelId: z.string().min(1),
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().toLowerCase(),
  size: z.number().int().positive().max(env.MAX_FILE_SIZE),
})

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.post('/presign', async (request, reply) => {
    const parsed = presignSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, message: 'File metadata không hợp lệ.', details: parsed.error.flatten().fieldErrors })
    if (!allowedTypes.has(parsed.data.contentType)) return reply.status(415).send({ statusCode: 415, message: 'Loại file này chưa được hỗ trợ.' })

    const channel = await prisma.channel.findFirst({
      where: { id: parsed.data.channelId, server: { members: { some: { userId: request.user.id, isBanned: false } } } },
      select: { id: true },
    })
    if (!channel) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy channel hoặc bạn không có quyền truy cập.' })

    const safeExtension = extname(parsed.data.filename).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 12)
    const key = `pending/${request.user.id}/${randomUUID()}${safeExtension}`
    const command = new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ContentType: parsed.data.contentType, ContentLength: parsed.data.size })
    try {
      const uploadUrl = await getSignedUrl(fastify.r2.s3, command, { expiresIn: 600 })
      return reply.send({ statusCode: 200, data: { uploadUrl, key, expiresIn: 600 } })
    } catch (error) {
      request.log.error(error, 'Failed to create upload URL')
      return reply.status(502).send({ statusCode: 502, message: 'Không thể chuẩn bị upload.' })
    }
  })

  fastify.delete<{ Body: { key: string } }>('/pending', async (request, reply) => {
    const parsed = z.object({ key: z.string().startsWith(`pending/${request.user.id}/`) }).safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, message: 'Object key không hợp lệ.' })
    const committed = await prisma.attachment.findFirst({ where: { r2Key: parsed.data.key }, select: { id: true } })
    if (committed) return reply.status(409).send({ statusCode: 409, message: 'File đã được gắn với tin nhắn.' })
    try {
      await fastify.r2.s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: parsed.data.key }))
      return reply.send({ statusCode: 200, data: { deleted: true } })
    } catch (error) {
      request.log.error(error, 'Failed to delete uncommitted upload')
      return reply.status(502).send({ statusCode: 502, message: 'Không thể xóa file tạm.' })
    }
  })

  fastify.get<{ Params: { attachmentId: string } }>('/:attachmentId/url', async (request, reply) => {
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: request.params.attachmentId,
        message: { channel: { server: { members: { some: { userId: request.user.id, isBanned: false } } } } },
      },
      select: { r2Key: true, filename: true, contentType: true },
    })
    if (!attachment) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy tệp.' })
    try {
      const url = await getSignedUrl(fastify.r2.s3, new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: attachment.r2Key,
        ResponseContentDisposition: `inline; filename="${attachment.filename.replace(/["\\\r\n]/g, '_')}"`,
        ResponseContentType: attachment.contentType,
      }), { expiresIn: 300 })
      return reply.redirect(url, 302)
    } catch (error) {
      request.log.error(error, 'Failed to create download URL')
      return reply.status(502).send({ statusCode: 502, message: 'Không thể tạo liên kết tải tệp.' })
    }
  })

}
