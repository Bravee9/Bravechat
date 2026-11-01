import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { blocked, dmInclude, fail, messageInclude, pairFilter, serializeMessage } from '../services/conversation'
import { publishChannelEvent, publishUserEvent } from './websocket.routes'

export async function messageActionRoutes(server: FastifyInstance) {
  // Hai loại hội thoại dùng cùng thao tác, nhưng kiểm tra quyền theo quan hệ riêng.
  for (const direct of [false, true]) {
    const prefix = direct ? '/dm/:userId/:messageId' : '/:messageId'
    type Params = { messageId: string; userId?: string }
    const load = async (params: Params, userId: string) => {
      if (direct) {
        const row = await prisma.directMessage.findFirst({ where: { id: params.messageId, isDeleted: false, ...pairFilter(userId, params.userId!) }, include: dmInclude })
        if (!row) throw fail(404, 'Không tìm thấy tin nhắn.')
        if (await blocked(userId, params.userId!)) throw fail(403, 'Không thể tương tác với cuộc trò chuyện đã bị chặn.')
        return row
      }
      const row = await prisma.message.findFirst({ where: { id: params.messageId, isDeleted: false, channel: { server: { members: { some: { userId, isBanned: false } } } } }, include: { ...messageInclude, channel: { select: { server: { select: { ownerId: true } } } } } })
      if (!row) throw fail(404, 'Không tìm thấy tin nhắn hoặc bạn không có quyền truy cập.')
      return row
    }
    const emit = (row: any, payload: any) => {
      if (direct) for (const id of [row.senderId, row.receiverId]) publishUserEvent(id, { ...payload, senderId: row.senderId, receiverId: row.receiverId })
      else publishChannelEvent(row.channelId, payload)
    }
    const current = async (id: string) => direct ? prisma.directMessage.findUniqueOrThrow({ where: { id }, include: dmInclude }) : prisma.message.findUniqueOrThrow({ where: { id }, include: messageInclude })
    server.patch<{ Params: Params }>(prefix, async (request) => {
      const { content } = z.object({ content: z.string().trim().min(1).max(2000) }).strict().parse(request.body)
      const row: any = await load(request.params, request.user.id)
      if ((row.authorId ?? row.senderId) !== request.user.id) throw fail(403, 'Bạn chỉ được sửa tin nhắn của mình.')
      const data = { content, isEdited: true, editedAt: new Date() }
      if (direct) await prisma.directMessage.update({ where: { id: row.id }, data })
      else await prisma.message.update({ where: { id: row.id }, data })
      const message = await serializeMessage(server, await current(row.id))
      emit(row, { type: direct ? 'dm_update' : 'message_update', message })
      return { statusCode: 200, data: { message } }
    })
    server.delete<{ Params: Params }>(prefix, async (request) => {
      const row: any = await load(request.params, request.user.id)
      // Người nhận DM không được xóa tin của đối phương; owner server được kiểm duyệt kênh.
      const own = (row.authorId ?? row.senderId) === request.user.id
      if (!own && (direct || row.channel.server.ownerId !== request.user.id)) throw fail(403, 'Bạn không có quyền xóa tin nhắn này.')
      if (direct) await prisma.directMessage.update({ where: { id: row.id }, data: { isDeleted: true } })
      else await prisma.message.update({ where: { id: row.id }, data: { isDeleted: true, deletedAt: new Date() } })
      emit(row, { type: direct ? 'dm_delete' : 'message_delete', messageId: row.id })
      return { statusCode: 200, data: null }
    })
    const reaction = async (params: Params, userId: string, emoji: string, remove: boolean) => {
      const row: any = await load(params, userId)
      const key = { messageId: row.id, userId, emoji }
      if (direct) {
        if (remove) await prisma.directMessageReaction.deleteMany({ where: key })
        else await prisma.directMessageReaction.upsert({ where: { messageId_userId_emoji: key }, create: key, update: {} })
      } else {
        if (remove) await prisma.messageReaction.deleteMany({ where: key })
        else await prisma.messageReaction.upsert({ where: { messageId_userId_emoji: key }, create: key, update: {} })
      }
      const message = await serializeMessage(server, await current(row.id))
      emit(row, { type: direct ? 'dm_update' : 'message_update', message })
      return { statusCode: 200, data: { message } }
    }
    const emojiSchema = z.enum(['👍', '❤️', '😂', '😮', '😢', '🎉'])
    server.post<{ Params: Params }>(prefix + '/reactions', async (request) => reaction(request.params, request.user.id, z.object({ emoji: emojiSchema }).parse(request.body).emoji, false))
    server.delete<{ Params: Params & { emoji: string } }>(prefix + '/reactions/:emoji', async (request) => reaction(request.params, request.user.id, emojiSchema.parse(request.params.emoji), true))
  }
}
