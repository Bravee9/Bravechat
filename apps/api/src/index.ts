// ============================================================
// apps/api/src/index.ts
// Entry point cho Fastify server
// ============================================================

import Fastify from 'fastify'
import { registerPlugins } from './plugins'
import { registerRoutes } from './routes'
import { env } from './config/env'

const server = Fastify({
  logger: {
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
