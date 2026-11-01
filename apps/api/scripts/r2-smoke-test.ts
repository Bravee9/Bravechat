/**
 * apps/api/scripts/r2-smoke-test.ts
 * Kiểm thử kết nối Cloudflare R2 end-to-end, không cần database.
 *
 *   pnpm --filter @discord-clone/api r2:test
 *
 * Các bước:
 *   1. HeadBucket — credentials + endpoint + tên bucket đúng chưa
 *   2. PutObject một ảnh PNG 1x1 từ server
 *   3. HeadObject — kiểm size và Content-Type
 *   4. Presigned GET — tải lại, so từng byte
 *   5. Presigned PUT — giả lập trình duyệt upload trực tiếp (luồng đính kèm tin nhắn)
 *   6. CORS preflight — trình duyệt ở FRONTEND_URL có được PUT thẳng lên R2 không
 *   7. Dọn dẹp — xoá các object test
 */

import { randomUUID } from 'node:crypto'
import { env } from '../src/config/env'
import { createR2Client, StorageService } from '../src/services/storage.service'

// PNG 1x1 trong suốt
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

type StepResult = { step: string; ok: boolean; detail: string }
const results: StepResult[] = []

async function step(name: string, run: () => Promise<string>) {
  try {
    const detail = await run()
    results.push({ step: name, ok: true, detail })
    console.log(`  ✅ ${name} — ${detail}`)
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    results.push({ step: name, ok: false, detail })
    console.log(`  ❌ ${name} — ${detail}`)
  }
}

async function main() {
  const s3 = createR2Client()
  const storage = new StorageService(s3)
  const runId = randomUUID()
  const serverKey = `healthcheck/${runId}/server-upload.png`
  const browserKey = `healthcheck/${runId}/presigned-upload.png`

  console.log(`\n☁️  Cloudflare R2 smoke test`)
  console.log(`   endpoint: ${env.R2_ENDPOINT_URL}`)
  console.log(`   bucket:   ${env.R2_BUCKET_NAME}\n`)

  await step('1. HeadBucket', async () => {
    const { latencyMs } = await storage.checkConnection()
    return `bucket tồn tại, ${latencyMs}ms`
  })

  await step('2. PutObject (server → R2)', async () => {
    await storage.putObject(serverKey, PNG_1X1, 'image/png')
    return `${serverKey} (${PNG_1X1.length} bytes)`
  })

  await step('3. HeadObject', async () => {
    const head = await storage.headObject(serverKey)
    if (!head) throw new Error('object không tồn tại sau khi upload')
    if (head.size !== PNG_1X1.length) throw new Error(`size lệch: ${head.size}`)
    if (head.contentType !== 'image/png') throw new Error(`content-type lệch: ${head.contentType}`)
    return `size=${head.size}, type=${head.contentType}`
  })

  await step('4. Presigned GET (tải lại ảnh)', async () => {
    const url = await storage.presignGet(serverKey, { expiresIn: 60 })
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (!bytes.equals(PNG_1X1)) throw new Error('nội dung tải về khác bản gốc')
    return `HTTP ${response.status}, khớp ${bytes.length} bytes`
  })

  await step('5. Presigned PUT (client → R2)', async () => {
    const url = await storage.presignPut(browserKey, 'image/png', PNG_1X1.length, 60)
    const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: PNG_1X1 })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    const head = await storage.headObject(browserKey)
    if (!head) throw new Error('object không tồn tại sau presigned PUT')
    return `HTTP ${response.status}, ${browserKey}`
  })

  await step('6. CORS preflight từ FRONTEND_URL', async () => {
    const url = await storage.presignPut(`healthcheck/${runId}/cors.png`, 'image/png', PNG_1X1.length, 60)
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: { Origin: env.FRONTEND_URL, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' },
    })
    const allowOrigin = response.headers.get('access-control-allow-origin')
    if (!response.ok || !allowOrigin) {
      throw new Error(`bucket chưa cấu hình CORS cho ${env.FRONTEND_URL} (HTTP ${response.status}). Chạy: pnpm --filter @discord-clone/api r2:cors`)
    }
    return `allow-origin=${allowOrigin}`
  })

  await step('7. Dọn dẹp', async () => {
    await Promise.all([storage.deleteObject(serverKey), storage.deleteObject(browserKey)])
    const leftover = await storage.headObject(serverKey)
    if (leftover) throw new Error('object vẫn còn sau khi xoá')
    return 'đã xoá object test'
  })

  s3.destroy()
  const failed = results.filter((result) => !result.ok)
  console.log(`\n${failed.length === 0 ? '🎉 R2 hoạt động đầy đủ.' : `⚠️  ${failed.length}/${results.length} bước lỗi.`}\n`)
  process.exit(failed.length === 0 ? 0 : 1)
}

void main()
