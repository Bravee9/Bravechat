import type { FastifyInstance } from 'fastify'
import { prisma } from '../config/prisma'

export async function inviteRoutes(server: FastifyInstance) {
  server.addHook('preHandler', server.authenticate)

  server.post<{ Params: { code: string } }>('/:code', async (request, reply) => {
    const code = request.params.code.trim()
    const result = await prisma.$transaction(async (transaction) => {
      const invite = await transaction.serverInvite.findUnique({ where: { code } })
      if (!invite || (invite.expiresAt && invite.expiresAt <= new Date())) return { error: 'Mã mời không tồn tại hoặc đã hết hạn.', status: 404 as const }
      const existing = await transaction.serverMember.findUnique({ where: { userId_serverId: { userId: request.user.id, serverId: invite.serverId } } })
      if (existing?.isBanned) return { error: 'Bạn không thể tham gia server này.', status: 403 as const }
      if (existing) return { serverId: invite.serverId }
      if (invite.maxUses !== null && invite.uses >= invite.maxUses) return { error: 'Mã mời đã đạt giới hạn lượt sử dụng.', status: 410 as const }
      const consumed = await transaction.serverInvite.updateMany({
        where: { id: invite.id, uses: invite.uses },
        data: { uses: { increment: 1 } },
      })
      if (consumed.count !== 1) return { error: 'Mã mời vừa được sử dụng hết. Vui lòng thử lại.', status: 409 as const }
      await transaction.serverMember.create({ data: { userId: request.user.id, serverId: invite.serverId } })
      return { serverId: invite.serverId }
    })
    if ('error' in result) {
      const statusCode = result.status ?? 400
      return reply.status(statusCode).send({ statusCode, message: result.error })
    }
    return reply.send({ statusCode: 200, data: result })
  })
}
