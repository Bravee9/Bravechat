/**
 * apps/api/scripts/r2-cors.ts
 * Cấu hình CORS cho bucket R2 để trình duyệt PUT trực tiếp qua presigned URL.
 *
 *   pnpm --filter @discord-clone/api r2:cors
 *
 * Origin lấy từ FRONTEND_URL (+ R2_CORS_EXTRA_ORIGINS, phân tách bằng dấu phẩy).
 * Cần API token R2 có quyền "Admin Read & Write"; token chỉ "Object Read & Write"
 * sẽ bị từ chối — khi đó cấu hình tay trong Cloudflare Dashboard > R2 > Settings > CORS.
 */

import { GetBucketCorsCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import { env } from '../src/config/env'
import { createR2Client } from '../src/services/storage.service'

async function main() {
  const s3 = createR2Client()
  const origins = [env.FRONTEND_URL, ...(process.env.R2_CORS_EXTRA_ORIGINS ?? '').split(',')]
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)

  await s3.send(new PutBucketCorsCommand({
    Bucket: env.R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [{
        AllowedOrigins: origins,
        AllowedMethods: ['GET', 'PUT', 'HEAD'],
        AllowedHeaders: ['content-type', 'content-length'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      }],
    },
  }))

  const current = await s3.send(new GetBucketCorsCommand({ Bucket: env.R2_BUCKET_NAME }))
  console.log('✅ CORS đã cập nhật:', JSON.stringify(current.CORSRules, null, 2))
  s3.destroy()
}

main().catch((error) => {
  console.error('❌ Không cập nhật được CORS:', error instanceof Error ? error.message : error)
  process.exit(1)
})
