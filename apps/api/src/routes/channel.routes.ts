import type { FastifyInstance } from 'fastify'
export async function channelRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)
  // GET    /api/channels/:channelId            — Lấy thông tin channel
  // GET    /api/channels/:channelId/messages   — Lịch sử tin nhắn (cursor pagination)
  // POST   /api/channels/:channelId/messages   — Gửi tin nhắn (fallback nếu WS fail)
  // PATCH  /api/channels/:channelId/messages/:messageId — Sửa tin nhắn
  // DELETE /api/channels/:channelId/messages/:messageId — Xóa tin nhắn
  // PUT    /api/channels/:channelId/pins/:messageId      — Pin tin nhắn
  // POST   /api/channels/:channelId/typing    — Phát sự kiện "đang gõ..."
  server.get('/:channelId', async (_, reply) => reply.send({ statusCode: 200 }))
}
export async function messageRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)
  // POST /api/messages/:messageId/reactions/:emoji — Thêm reaction
  // DELETE /api/messages/:messageId/reactions/:emoji — Xóa reaction
  server.get('/', async (_, reply) => reply.send({ statusCode: 200 }))
}
export async function uploadRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)
  // POST /api/uploads/presign  — Lấy presigned URL để upload lên R2
  // POST /api/uploads/confirm  — Confirm file đã upload xong
  server.post('/presign', async (_, reply) => reply.status(200).send({ statusCode: 200, data: { presignedUrl: null } }))
  server.post('/confirm', async (_, reply) => reply.status(200).send({ statusCode: 200 }))
}
