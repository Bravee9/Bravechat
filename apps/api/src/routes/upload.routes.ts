/**
 * apps/api/src/routes/upload.routes.ts
 * Upload lên Cloudflare R2.
 *
 * POST   /api/uploads                 — upload qua API (multipart), file vào vùng pending/
 * POST   /api/uploads/presign         — presigned PUT để trình duyệt upload thẳng (cần CORS bucket)
 * DELETE /api/uploads/pending         — huỷ file pending chưa gắn vào entity
 * GET    /api/uploads/:attachmentId/url — 302 sang presigned GET của file đính kèm
 *
 * Mọi file đều vào `pending/<userId>/` trước. Chỉ khi entity (tin nhắn, hồ sơ, server)
 * được lưu thì file mới được copy sang key vĩnh viễn — giống luồng attachment của Discord.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { env } from '../config/env'
import { prisma } from '../config/prisma'
import { ASSET_RULES, IMAGE_TYPES, extensionForType, pendingKey, safeExtension, type AssetKind } from '../services/storage.service'

const ATTACHMENT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm',
  'application/pdf', 'text/plain', 'application/zip', 'application/octet-stream',
])

const PURPOSES = ['attachment', 'avatar', 'banner', 'server-icon', 'server-banner'] as const
type Purpose = (typeof PURPOSES)[number]

/** Nhận diện ảnh bằng magic bytes — không tin Content-Type do client gửi. */
export function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 6 && (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a')) return 'image/gif'
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp' && ['avif', 'avis'].includes(bytes.subarray(8, 12).toString('ascii'))) return 'image/avif'
  return null
}

/** Giữ để tương thích: kiểm file pending qua StorageService. */
export async function verifyUploadedObject(fastify: FastifyInstance, key: string, userId: string, expectedType: string) {
  return fastify.r2.storage.verifyPending(key, userId, { expectedType })
}

async function canUploadToChannel(channelId: string, userId: string) {
  return prisma.channel.findFirst({
    where: { id: channelId, server: { members: { some: { userId, isBanned: false } } } },
    select: { id: true },
  })
}

async function canManageServer(serverId: string, userId: string) {
  return prisma.server.findFirst({ where: { id: serverId, ownerId: userId }, select: { id: true } })
}

const presignSchema = z.object({
  purpose: z.enum(PURPOSES).default('attachment'),
  channelId: z.string().min(1).optional(),
  serverId: z.string().min(1).optional(),
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().toLowerCase(),
  size: z.number().int().positive().max(env.MAX_FILE_SIZE),
})

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  async function authorizePurpose(purpose: Purpose, userId: string, ids: { channelId?: string; serverId?: string }) {
    if (purpose === 'attachment') {
      if (!ids.channelId || !(await canUploadToChannel(ids.channelId, userId))) return 'Không tìm thấy kênh hoặc bạn không có quyền gửi tệp.'
    }
    if (purpose === 'server-icon' || purpose === 'server-banner') {
      if (!ids.serverId || !(await canManageServer(ids.serverId, userId))) return 'Chỉ chủ máy chủ mới đổi được ảnh máy chủ.'
    }
    return null
  }

  /**
   * POST /api/uploads (multipart/form-data)
   * Trường text (`purpose`, `channelId`, `serverId`) phải đứng TRƯỚC trường `file`.
   */
  fastify.post('/', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
    const data = await request.file().catch(() => undefined)
    if (!data) return reply.status(400).send({ statusCode: 400, message: 'Không nhận được tệp.' })

    const field = (name: string) => {
      const value = data.fields[name] as { value?: unknown } | undefined
      return typeof value?.value === 'string' ? value.value : undefined
    }
    const purpose = (PURPOSES as readonly string[]).includes(field('purpose') ?? '') ? (field('purpose') as Purpose) : 'attachment'
    const denied = await authorizePurpose(purpose, request.user.id, { channelId: field('channelId'), serverId: field('serverId') })
    if (denied) {
      data.file.resume()
      return reply.status(403).send({ statusCode: 403, message: denied })
    }

    let buffer: Buffer
    try {
      buffer = await data.toBuffer()
    } catch {
      return reply.status(413).send({ statusCode: 413, message: `Tệp vượt quá giới hạn ${Math.round(env.MAX_FILE_SIZE / 1024 / 1024)}MB.` })
    }
    if (!buffer.length) return reply.status(400).send({ statusCode: 400, message: 'Tệp rỗng.' })

    let contentType = (data.mimetype || 'application/octet-stream').toLowerCase()
    const sniffed = sniffImageType(buffer)
    if (purpose !== 'attachment') {
      const rule = ASSET_RULES[purpose as AssetKind]
      if (!sniffed || !IMAGE_TYPES.has(sniffed)) return reply.status(415).send({ statusCode: 415, message: 'Chỉ nhận ảnh PNG, JPG, GIF, WEBP hoặc AVIF.' })
      if (buffer.length > rule.maxBytes) return reply.status(413).send({ statusCode: 413, message: `Ảnh tối đa ${Math.round(rule.maxBytes / 1024 / 1024)}MB.` })
      contentType = sniffed
    } else {
      // Ảnh khai báo sai kiểu thì sửa theo nội dung thật; kiểu lạ thì từ chối.
      if (contentType.startsWith('image/') && sniffed) contentType = sniffed
      if (!ATTACHMENT_TYPES.has(contentType)) return reply.status(415).send({ statusCode: 415, message: 'Loại tệp này chưa được hỗ trợ.' })
    }

    const filename = (data.filename || 'file').slice(0, 255)
    const key = pendingKey(request.user.id, extensionForType(contentType) || safeExtension(filename))
    try {
      await fastify.r2.storage.putObject(key, buffer, contentType)
    } catch (error) {
      request.log.error(error, 'R2 upload failed')
      return reply.status(502).send({ statusCode: 502, message: 'Không tải được tệp lên kho lưu trữ.' })
    }
    return reply.status(201).send({ statusCode: 201, data: { key, filename, contentType, size: buffer.length, purpose } })
  })

  fastify.post('/presign', async (request, reply) => {
    const parsed = presignSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, message: 'Thông tin tệp không hợp lệ.', details: parsed.error.flatten().fieldErrors })
    const { purpose, contentType, size, filename } = parsed.data
    const allowed = purpose === 'attachment' ? ATTACHMENT_TYPES : IMAGE_TYPES
    if (!allowed.has(contentType)) return reply.status(415).send({ statusCode: 415, message: 'Loại tệp này chưa được hỗ trợ.' })
    if (purpose !== 'attachment' && size > ASSET_RULES[purpose as AssetKind].maxBytes) return reply.status(413).send({ statusCode: 413, message: 'Ảnh quá lớn.' })
    const denied = await authorizePurpose(purpose, request.user.id, parsed.data)
    if (denied) return reply.status(403).send({ statusCode: 403, message: denied })

    const key = pendingKey(request.user.id, extensionForType(contentType) || safeExtension(filename))
    try {
      const uploadUrl = await fastify.r2.storage.presignPut(key, contentType, size, 600)
      return reply.send({ statusCode: 200, data: { uploadUrl, key, expiresIn: 600 } })
    } catch (error) {
      request.log.error(error, 'Failed to create upload URL')
      return reply.status(502).send({ statusCode: 502, message: 'Không thể chuẩn bị upload.' })
    }
  })

  fastify.delete<{ Body: { key: string } }>('/pending', async (request, reply) => {
    const parsed = z.object({ key: z.string().startsWith(`pending/${request.user.id}/`) }).safeParse(request.body)
    if (!parsed.success || parsed.data.key.includes('..')) return reply.status(400).send({ statusCode: 400, message: 'Object key không hợp lệ.' })
    try {
      await fastify.r2.storage.deleteObject(parsed.data.key)
      return reply.send({ statusCode: 200, data: { deleted: true } })
    } catch (error) {
      request.log.error(error, 'Failed to delete uncommitted upload')
      return reply.status(502).send({ statusCode: 502, message: 'Không thể xoá tệp tạm.' })
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
      const url = await fastify.r2.storage.presignGet(attachment.r2Key, { filename: attachment.filename, contentType: attachment.contentType })
      return reply.redirect(url, 302)
    } catch (error) {
      request.log.error(error, 'Failed to create download URL')
      return reply.status(502).send({ statusCode: 502, message: 'Không thể tạo liên kết tải tệp.' })
    }
  })
}
