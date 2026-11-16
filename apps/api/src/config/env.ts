// ============================================================
// apps/api/src/config/env.ts
// Centralized environment variable validation using Zod
// ============================================================

import { z } from 'zod'
import dotenv from 'dotenv'
import { resolve } from 'node:path'

dotenv.config()
dotenv.config({ path: resolve(__dirname, '../../../../.env') })
const optionalCredential = (schema: z.ZodString) => z.preprocess(
  (value) => typeof value === 'string' && /^(your_|CHANGE_ME|unconfigured)/i.test(value) ? undefined : value,
  schema.optional(),
)

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_ENABLED: z.enum(['true', 'false']).default('false'),

  // Auth & Email Delivery (Gmail SMTP / Resend)
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RESEND_API_KEY: z.string().optional(),
  RESET_EMAIL_FROM: z.string().optional(),
  GMAIL_USER: optionalCredential(z.string().trim().email()),
  GMAIL_APP_PASSWORD: optionalCredential(z.string().trim().min(8)),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),

  // Cloudflare R2 / MinIO (Object Storage)
  STORAGE_DRIVER: z.enum(['r2', 'minio', 's3']).default('r2'),
  S3_FORCE_PATH_STYLE: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  R2_BUCKET_NAME: z.string().trim().min(3).optional(),
  R2_ENDPOINT_URL: z.string().trim().url().optional(),
  R2_ACCESS_KEY_ID: optionalCredential(z.string().trim().min(5)),
  R2_SECRET_ACCESS_KEY: optionalCredential(z.string().trim().min(8)),
  // Bỏ trống nếu bucket private (khi đó media đi qua /api/media/*)
  R2_PUBLIC_URL: z.preprocess((value) => (value === '' || (typeof value === 'string' && value.includes('xxxx')) ? undefined : value), z.string().url().optional()),
  LIVEKIT_URL: z.string().url().optional(),
  LIVEKIT_API_URL: z.string().url().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  LIVEKIT_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(300),

  // App
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  // URL công khai của chính API — dùng để dựng link /api/media/* cho avatar, banner
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  MAX_FILE_SIZE: z.coerce.number().default(50 * 1024 * 1024), // 50MB
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  ...parsed.data,
  STORAGE_ENABLED: Boolean(parsed.data.R2_BUCKET_NAME && parsed.data.R2_ENDPOINT_URL && parsed.data.R2_ACCESS_KEY_ID && parsed.data.R2_SECRET_ACCESS_KEY),
  R2_BUCKET_NAME: parsed.data.R2_BUCKET_NAME ?? 'unconfigured',
  R2_ENDPOINT_URL: parsed.data.R2_ENDPOINT_URL ?? 'http://127.0.0.1:9000',
  R2_ACCESS_KEY_ID: parsed.data.R2_ACCESS_KEY_ID ?? '',
  R2_SECRET_ACCESS_KEY: parsed.data.R2_SECRET_ACCESS_KEY ?? '',
  S3_FORCE_PATH_STYLE: parsed.data.S3_FORCE_PATH_STYLE || false,
}
export type Env = typeof env
