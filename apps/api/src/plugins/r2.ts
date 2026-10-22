import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import type { S3Client } from '@aws-sdk/client-s3'
import { createR2Client, StorageService } from '../services/storage.service'

export interface R2Plugin {
  s3: S3Client
  storage: StorageService
}

declare module 'fastify' {
  interface FastifyInstance {
    r2: R2Plugin
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const s3 = createR2Client()
  const storage = new StorageService(s3)
  fastify.decorate('r2', { s3, storage })

  // Kiểm kết nối lúc khởi động: không chặn boot, chỉ log rõ để biết R2 có sẵn sàng không.
  fastify.addHook('onReady', async () => {
    try {
      const { bucket, latencyMs } = await storage.checkConnection()
      fastify.log.info(`☁️  Cloudflare R2 connected: bucket "${bucket}" (${latencyMs}ms)`)
    } catch (error) {
      fastify.log.error(error, '☁️  Cloudflare R2 connection failed — kiểm tra R2_* trong .env')
    }
  })

  fastify.addHook('onClose', async () => s3.destroy())
}, { name: 'fastify-r2' })
