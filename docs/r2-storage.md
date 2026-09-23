# Cloudflare R2 Storage Documentation

## Tổng quan

Bravechat dùng **Cloudflare R2** thay thế cho MinIO để lưu trữ mọi file media:
- Avatar và banner người dùng
- Icon và banner server
- Ảnh, video, file đính kèm trong tin nhắn
- GIF và sticker tùy chỉnh

R2 tương thích hoàn toàn với **AWS S3 API**, sử dụng `@aws-sdk/client-s3`.

## Cấu hình

### Thông tin bucket
```
Bucket Name:   discord-clone-assets
Account ID:    d18481e864512aa8dc03e59c3d1c6825
Endpoint URL:  https://d18481e864512aa8dc03e59c3d1c6825.r2.cloudflarestorage.com
```

### Cấu trúc thư mục trong bucket
```
discord-clone-assets/
├── avatars/
│   └── {userId}/{timestamp}-{uuid}.webp
├── banners/
│   ├── users/{userId}/{timestamp}-{uuid}.webp
│   └── servers/{serverId}/{timestamp}-{uuid}.webp
├── icons/
│   └── servers/{serverId}/{timestamp}-{uuid}.webp
├── attachments/
│   └── {serverId}/{channelId}/{messageId}/{filename}
└── temp/
    └── {uuid}              ← Files chưa được confirm (TTL 24h)
```

## R2 Service Implementation

```typescript
// apps/api/src/services/r2.service.ts

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env'

export const r2Client = new S3Client({
  region: 'auto',  // R2 dùng 'auto'
  endpoint: env.R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Upload file lên R2
 * @returns R2 object key (lưu vào database)
 */
export async function uploadToR2(params: {
  key: string
  body: Buffer | Uint8Array | ReadableStream
  contentType: string
  metadata?: Record<string, string>
}): Promise<string> {
  await r2Client.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    Metadata: params.metadata,
  }))
  return params.key
}

/**
 * Tạo presigned URL để client upload trực tiếp (không qua API server)
 * Hạn 15 phút
 */
export async function createPresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(r2Client, command, { expiresIn: 900 })
}

/**
 * Xóa file khỏi R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  }))
}

/**
 * Lấy public URL từ R2 key
 * Yêu cầu bucket có Public Access enabled hoặc custom domain
 */
export function getPublicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL}/${key}`
}
```

## Naming Convention cho R2 Keys

```typescript
// packages/shared/src/utils/r2-keys.ts

export const R2Keys = {
  avatar: (userId: string, ext = 'webp') =>
    `avatars/${userId}/${Date.now()}-${randomHex(8)}.${ext}`,

  userBanner: (userId: string, ext = 'webp') =>
    `banners/users/${userId}/${Date.now()}-${randomHex(8)}.${ext}`,

  serverIcon: (serverId: string, ext = 'webp') =>
    `icons/servers/${serverId}/${Date.now()}-${randomHex(8)}.${ext}`,

  serverBanner: (serverId: string, ext = 'webp') =>
    `banners/servers/${serverId}/${Date.now()}-${randomHex(8)}.${ext}`,

  attachment: (serverId: string, channelId: string, messageId: string, filename: string) =>
    `attachments/${serverId}/${channelId}/${messageId}/${filename}`,

  temp: (uuid: string) => `temp/${uuid}`,
}
```

## File Validation

```typescript
// apps/api/src/utils/file-validation.ts

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
]
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime'
]
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/ogg', 'audio/wav'
]
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  'application/pdf',
  'application/zip',
  'text/plain',
]

export const SIZE_LIMITS = {
  avatar:     8 * 1024 * 1024,   // 8MB
  attachment: 50 * 1024 * 1024,  // 50MB
  video:      100 * 1024 * 1024, // 100MB (nén xử lý bởi BullMQ)
}
```

## Upload Flow (Attachment)

```
1. Client → POST /api/uploads/presign
   Body: { contentType, filename, messageContext }
   Response: { key, presignedUrl, attachmentId }

2. Client → PUT {presignedUrl} (trực tiếp lên R2)
   Body: file bytes

3. Client → POST /api/uploads/confirm
   Body: { attachmentId }
   → API verify file tồn tại trên R2
   → Update attachment status → CONFIRMED
   → Publish WebSocket event đến channel
```

## Media Processing Queue (BullMQ)

Các jobs được xử lý bởi worker Python:
- **VIDEO_COMPRESS**: Nén video xuống 720p/1080p với FFmpeg
- **IMAGE_RESIZE**: Tạo thumbnail (160x160) cho preview
- **GENERATE_WAVEFORM**: Tạo waveform SVG cho audio files
- **EXTRACT_METADATA**: Lấy duration, dimensions, codec info
