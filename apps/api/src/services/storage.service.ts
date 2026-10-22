/**
 * apps/api/src/services/storage.service.ts
 * Lớp truy cập Cloudflare R2 (S3-compatible). Mọi route chỉ gọi qua đây,
 * không tự dựng Command của AWS SDK, để quy ước key / URL nằm ở một chỗ.
 *
 * Quy ước key (giống CDN của Discord: tách theo loại tài nguyên):
 *   pending/<userId>/<uuid>.<ext>          — file vừa upload, chưa gắn vào entity
 *   attachments/<channelId>/<uuid>.<ext>   — file đính kèm tin nhắn (private, presigned GET)
 *   avatars/<userId>/<uuid>.<ext>          — avatar người dùng (public)
 *   banners/<userId>/<uuid>.<ext>          — ảnh nền hồ sơ (public)
 *   server-icons/<serverId>/<uuid>.<ext>   — icon máy chủ (public)
 *   server-banners/<serverId>/<uuid>.<ext> — ảnh nền máy chủ (public)
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { env } from '../config/env'

export const PUBLIC_MEDIA_PREFIXES = ['avatars/', 'banners/', 'server-icons/', 'server-banners/'] as const

export type AssetKind = 'avatar' | 'banner' | 'server-icon' | 'server-banner'

export const ASSET_RULES: Record<AssetKind, { prefix: string; maxBytes: number }> = {
  avatar: { prefix: 'avatars', maxBytes: 8 * 1024 * 1024 },
  banner: { prefix: 'banners', maxBytes: 10 * 1024 * 1024 },
  'server-icon': { prefix: 'server-icons', maxBytes: 8 * 1024 * 1024 },
  'server-banner': { prefix: 'server-banners', maxBytes: 10 * 1024 * 1024 },
}

export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])

export function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
}

/** Đuôi file an toàn: chỉ chữ thường, số, tối đa 12 ký tự. */
export function safeExtension(filename: string) {
  return extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 12)
}

export function extensionForType(contentType: string) {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/avif': '.avif',
  }
  return map[contentType] ?? ''
}

export function pendingKey(userId: string, extension: string) {
  return `pending/${userId}/${randomUUID()}${extension}`
}

export function isPublicMediaKey(key: string) {
  return PUBLIC_MEDIA_PREFIXES.some((prefix) => key.startsWith(prefix)) && !key.includes('..')
}

/**
 * URL ổn định cho tài nguyên public (avatar, banner, icon).
 * Có R2_PUBLIC_URL (custom domain / r2.dev) thì trỏ thẳng CDN; không thì đi qua
 * `/api/media/*` của API, route đó 302 sang presigned GET.
 */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (env.R2_PUBLIC_URL) return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
  return `${env.API_PUBLIC_URL.replace(/\/$/, '')}/api/media/${key.split('/').map(encodeURIComponent).join('/')}`
}

export class StorageService {
  constructor(private readonly s3: S3Client, private readonly bucket = env.R2_BUCKET_NAME) {}

  async checkConnection() {
    const started = Date.now()
    await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }))
    return { bucket: this.bucket, latencyMs: Date.now() - started }
  }

  putObject(key: string, body: Buffer | Uint8Array | string, contentType: string) {
    return this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }))
  }

  async headObject(key: string) {
    try {
      const result = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      return { size: result.ContentLength ?? 0, contentType: result.ContentType ?? 'application/octet-stream' }
    } catch {
      return null
    }
  }

  presignPut(key: string, contentType: string, size: number, expiresIn = 600) {
    return getSignedUrl(this.s3, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType, ContentLength: size }), { expiresIn })
  }

  presignGet(key: string, options: { expiresIn?: number; filename?: string; contentType?: string } = {}) {
    return getSignedUrl(this.s3, new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(options.filename ? { ResponseContentDisposition: `inline; filename="${options.filename.replace(/["\\\r\n]/g, '_')}"` } : {}),
      ...(options.contentType ? { ResponseContentType: options.contentType } : {}),
    }), { expiresIn: options.expiresIn ?? 300 })
  }

  copyObject(sourceKey: string, targetKey: string) {
    return this.s3.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: targetKey,
      CopySource: `${this.bucket}/${sourceKey.split('/').map(encodeURIComponent).join('/')}`,
    }))
  }

  deleteObject(key: string) {
    return this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  /** Xoá không ném lỗi — dùng cho dọn dẹp sau khi đã commit. */
  async deleteQuietly(key: string | null | undefined) {
    if (!key) return
    await this.deleteObject(key).catch(() => undefined)
  }

  /**
   * Kiểm file đang ở vùng pending của đúng user, đúng loại, không quá cỡ.
   * Trả null nếu không hợp lệ (chưa upload xong, sai chủ, sai loại...).
   */
  async verifyPending(key: string, userId: string, options: { expectedType?: string; allowedTypes?: Set<string>; maxBytes?: number } = {}) {
    if (!key.startsWith(`pending/${userId}/`) || key.includes('..')) return null
    const object = await this.headObject(key)
    if (!object || !object.size) return null
    if (object.size > (options.maxBytes ?? env.MAX_FILE_SIZE)) return null
    if (options.expectedType && object.contentType !== options.expectedType) return null
    if (options.allowedTypes && !options.allowedTypes.has(object.contentType)) return null
    return object
  }

  /**
   * Chuyển một file pending thành tài nguyên public của entity (avatar, banner, icon).
   * Copy sang key vĩnh viễn rồi xoá bản pending. Trả key mới.
   */
  async commitAsset(pending: string, kind: AssetKind, ownerId: string, contentType: string) {
    const target = `${ASSET_RULES[kind].prefix}/${ownerId}/${randomUUID()}${extensionForType(contentType) || safeExtension(pending)}`
    await this.copyObject(pending, target)
    await this.deleteQuietly(pending)
    return target
  }
}
