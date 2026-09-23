/**
 * apps/api/src/routes/user.routes.ts
 * User management: profile, avatar, status, friends
 *
 * GET    /api/users/:userId           — Xem profile user
 * PATCH  /api/users/@me              — Cập nhật profile của mình
 * PATCH  /api/users/@me/status       — Thay đổi trạng thái (online/idle/dnd)
 * POST   /api/users/@me/avatar       — Upload avatar
 * GET    /api/users/@me/friends      — Danh sách bạn bè
 * POST   /api/users/@me/friends      — Gửi lời mời kết bạn
 * PUT    /api/users/@me/friends/:id  — Chấp nhận/từ chối lời mời
 * DELETE /api/users/@me/friends/:id  — Hủy kết bạn / bỏ chặn
 */

import type { FastifyInstance } from 'fastify'

export async function userRoutes(server: FastifyInstance) {
  // All user routes require authentication
  server.addHook('preHandler', server.authenticate)

  server.get('/:userId', async (request, reply) => {
    // TODO: UserService.getPublicProfile(userId)
    return reply.send({ statusCode: 200, data: { user: null } })
  })

  server.patch('/@me', async (request, reply) => {
    // TODO: UserService.updateProfile(userId, body)
    return reply.send({ statusCode: 200, data: { user: null } })
  })

  server.patch('/@me/status', async (request, reply) => {
    // TODO: UserService.updateStatus(userId, status)
    // Also publish to Redis Pub/Sub for real-time presence update
    return reply.send({ statusCode: 200 })
  })

  server.post('/@me/avatar', async (request, reply) => {
    // TODO: Parse multipart, upload to R2, update user.avatarKey
    return reply.send({ statusCode: 200, data: { avatarUrl: null } })
  })

  server.get('/@me/friends', async (request, reply) => {
    // TODO: UserService.getFriends(userId)
    return reply.send({ statusCode: 200, data: { friends: [] } })
  })

  server.post('/@me/friends', async (request, reply) => {
    // TODO: UserService.sendFriendRequest(fromId, toUsername)
    return reply.status(201).send({ statusCode: 201 })
  })

  server.put('/@me/friends/:friendshipId', async (request, reply) => {
    // TODO: UserService.respondToFriendRequest(friendshipId, action)
    return reply.send({ statusCode: 200 })
  })

  server.delete('/@me/friends/:friendshipId', async (request, reply) => {
    // TODO: UserService.removeFriend(userId, friendshipId)
    return reply.send({ statusCode: 200 })
  })
}
