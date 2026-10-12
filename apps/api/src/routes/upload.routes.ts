import type { FastifyPluginAsync } from 'fastify'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { env } from '../config/env'
import crypto from 'crypto'

const presignSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(env.MAX_FILE_SIZE, "File too large")
})

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/presign', async (request, reply) => {
    // Authentication enforcement (Assuming JWT plugin populates request.user)
    try {
      await request.jwtVerify()
    } catch (err) {
      return reply.status(401).send({ error: "Unauthorized" })
    }
    
    const parsed = presignSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ 
        error: "Invalid request payload", 
        details: parsed.error.flatten().fieldErrors 
      })
    }

    const { filename, contentType } = parsed.data
    const ext = filename.split('.').pop()
    const uniqueName = `${crypto.randomUUID()}.${ext}`
    
    // YYYY-MM-DD/uuid.ext for better S3 partitioning
    const datePrefix = new Date().toISOString().split('T')[0]
    const key = `uploads/${datePrefix}/${uniqueName}`

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    try {
      // Create a presigned URL that expires in 15 minutes (900 seconds)
      const url = await getSignedUrl(fastify.r2.s3, command, { expiresIn: 900 })
      
      const publicUrl = env.R2_PUBLIC_URL 
        ? `${env.R2_PUBLIC_URL}/${key}`
        : `${env.R2_ENDPOINT_URL}/${env.R2_BUCKET_NAME}/${key}`
        
      return reply.send({
        uploadUrl: url,
        fileUrl: publicUrl,
        key
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Failed to generate presigned URL" })
    }
  })
}
