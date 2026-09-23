// Stub routes — xem docs/api-reference.md để biết đầy đủ
import type { FastifyInstance } from 'fastify'
export async function serverRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)
  // POST   /api/servers                  — Tạo server mới
  // GET    /api/servers/:serverId         — Lấy thông tin server
  // PATCH  /api/servers/:serverId         — Cập nhật server (tên, icon, banner)
  // DELETE /api/servers/:serverId         — Xóa server (owner only)
  // GET    /api/servers/:serverId/members — Danh sách thành viên
  // DELETE /api/servers/:serverId/members/:userId — Kick member
  // GET    /api/servers/:serverId/invites — Danh sách invite codes
  // POST   /api/servers/:serverId/invites — Tạo invite code
  // POST   /api/invites/:code            — Join server bằng invite code

  server.get('/', async (_, reply) => reply.send({ statusCode: 200, data: [] }))
  server.post('/', async (_, reply) => reply.status(201).send({ statusCode: 201 }))
}
