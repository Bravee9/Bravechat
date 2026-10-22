/**
 * apps/api/src/routes/media.routes.ts
 * GET /api/media/<key> — link ổn định cho tài nguyên public (avatar, banner, icon máy chủ).
 *
 * Bucket R2 để private; route này 302 sang presigned GET ngắn hạn. Trình duyệt cache
 * redirect nên mỗi ảnh chỉ ký lại khoảng một lần mỗi giờ. Có R2_PUBLIC_URL thì
 * `mediaUrl()` trỏ thẳng CDN và route này không được dùng tới.
 */

import type { FastifyInstance } from 'fastify'
import { isPublicMediaKey } from '../services/storage.service'

export async function mediaRoutes(server: FastifyInstance) {
  server.get<{ Params: { '*': string } }>('/*', { config: { rateLimit: { max: 600, timeWindow: '1 minute' } } }, async (request, reply) => {
    const key = decodeURIComponent(request.params['*'] ?? '')
    if (!isPublicMediaKey(key)) return reply.status(404).send({ statusCode: 404, message: 'Không tìm thấy tài nguyên.' })
    try {
      const url = await server.r2.storage.presignGet(key, { expiresIn: 3600 })
      reply.header('Cache-Control', 'public, max-age=3000, immutable')
      return reply.redirect(url, 302)
    } catch (error) {
      request.log.error(error, 'Failed to sign media URL')
      return reply.status(502).send({ statusCode: 502, message: 'Không tải được tài nguyên.' })
    }
  })
}
