// ============================================================
// apps/api/src/index.ts
// Entry point cho Fastify server
// ============================================================

import Fastify from 'fastify'
import { registerPlugins } from './plugins'
import { registerRoutes } from './routes'
import { env } from './config/env'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

const server = Fastify({
  logger: {
    redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  },
})

async function bootstrap() {
  try {
    server.setErrorHandler((error, request, reply) => {
      if (error instanceof ZodError) return reply.code(400).send({ statusCode: 400, message: error.errors[0]?.message ?? 'Dữ liệu không hợp lệ.' })
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return reply.code(409).send({ statusCode: 409, message: 'Dữ liệu đã tồn tại.' })
      const status = error.statusCode ?? 500
      if (status >= 500) request.log.error(error)
      return reply.code(status).send({ statusCode: status, message: status >= 500 ? 'Máy chủ tạm thời không thể xử lý yêu cầu.' : error.message })
    })
    // Register all plugins (cors, jwt, multipart, etc.)
    await registerPlugins(server)

    // Register all API routes
    await registerRoutes(server)

    // Start listening
    await server.listen({
      port: env.PORT,
      host: env.HOST,
    })

    server.log.info(`🚀 Discord Clone API running on http://${env.HOST}:${env.PORT}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

bootstrap()
