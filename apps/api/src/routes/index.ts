/**
 * apps/api/src/routes/index.ts
 * Register tất cả API routes vào Fastify instance
 */

import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes'
import { userRoutes } from './user.routes'
import { serverRoutes } from './server.routes'
import { channelRoutes } from './channel.routes'
import { messageRoutes } from './message.routes'
import { uploadRoutes } from './upload.routes'
import { websocketRoutes } from './websocket.routes'

export async function registerRoutes(server: FastifyInstance) {
  // Direct WebSocket at /ws
  await server.register(websocketRoutes)

  // All routes prefixed with /api
  await server.register(async (api) => {
    // WebSocket at /api/ws
    await api.register(websocketRoutes)

    // Auth: /api/auth/*
    await api.register(authRoutes, { prefix: '/auth' })

    // Users: /api/users/*
    await api.register(userRoutes, { prefix: '/users' })

    // Servers (Guilds): /api/servers/*
    await api.register(serverRoutes, { prefix: '/servers' })

    // Channels: /api/channels/*
    await api.register(channelRoutes, { prefix: '/channels' })

    // Messages: /api/messages/*
    await api.register(messageRoutes, { prefix: '/messages' })

    // Uploads (R2 presigned URLs): /api/uploads/*
    await api.register(uploadRoutes, { prefix: '/uploads' })
  }, { prefix: '/api' })
}

