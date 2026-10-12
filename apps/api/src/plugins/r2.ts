import fp from 'fastify-plugin'
import { S3Client } from '@aws-sdk/client-s3'
import { env } from '../config/env'

export interface R2Plugin {
  s3: S3Client
}

declare module 'fastify' {
  interface FastifyInstance {
    r2: R2Plugin
  }
}

import type { FastifyInstance } from 'fastify'

export default fp(async (fastify: FastifyInstance) => {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT_URL,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })

  fastify.decorate('r2', { s3 })
}, { name: 'fastify-r2' })
