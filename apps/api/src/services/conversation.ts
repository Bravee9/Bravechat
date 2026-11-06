import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import { mediaUrl } from './storage.service'

export const authorSelect = { id: true, username: true, displayName: true, status: true, avatarKey: true } as const
export const messageInclude = {
  author: { select: authorSelect }, attachments: true, reactions: true,
  replyTo: { select: { id: true, content: true, isDeleted: true, author: { select: authorSelect } } },
} as const
export const dmInclude = {
  sender: { select: authorSelect }, reactions: true,
  replyTo: { select: { id: true, content: true, isDeleted: true, sender: { select: authorSelect } } },
} as const
export const pairFilter = (a: string, b: string) => ({ OR: [{ senderId: a, receiverId: b }, { senderId: b, receiverId: a }] })
export const friendshipPair = (a: string, b: string) => ({ OR: [{ userId: a, friendId: b }, { userId: b, friendId: a }] })
export const blocked = (a: string, b: string) => prisma.friendship.findFirst({ where: { ...friendshipPair(a, b), status: 'BLOCKED' }, select: { id: true } })
export const fail = (statusCode: number, message: string) => Object.assign(new Error(message), { statusCode })

// Hai lời mời đối ứng hoặc hai lần gửi cùng nonce phải có một kết quả duy nhất.
// PostgreSQL có thể hủy transaction tranh chấp; chỉ thử lại lỗi serialization này.
export async function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }) }
    catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 3)) throw error
    }
  }
}

// Dùng một DTO cho REST và WebSocket để reply/reaction không mất khi tải lại lịch sử.
export async function serializeMessage(server: FastifyInstance, row: any) {
  const author = row.author ?? row.sender
  const parentAuthor = row.replyTo?.author ?? row.replyTo?.sender
  const groups = new Map<string, string[]>()
  for (const reaction of row.reactions ?? []) groups.set(reaction.emoji, [...(groups.get(reaction.emoji) ?? []), reaction.userId])
  const attachments = await Promise.all((row.attachments ?? []).map(async (item: any) => ({
    id: item.id, filename: item.filename, contentType: item.contentType, size: item.size,
    ...(server.r2 && env.STORAGE_ENABLED ? {
      url: await server.r2.storage.presignGet(item.r2Key, { filename: item.filename, contentType: item.contentType }),
    } : {}),
  })))
  return {
    id: row.id, channelId: row.channelId, senderId: row.senderId, receiverId: row.receiverId,
    content: row.content ?? '', nonce: row.nonce, replyToId: row.replyToId, createdAt: row.createdAt, editedAt: row.editedAt,
    isEdited: row.isEdited, isPinned: row.isPinned ?? false, author: { id: author.id, username: author.username, displayName: author.displayName, status: author.status, avatarUrl: mediaUrl(author.avatarKey) },
    user: author.displayName || author.username,
    avatar: (author.displayName || author.username).slice(0, 2).toUpperCase(),
    time: new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    replyTo: row.replyTo ? { id: row.replyTo.id, content: row.replyTo.isDeleted ? 'Tin nhắn đã xóa' : row.replyTo.content ?? '', user: parentAuthor?.displayName || parentAuthor?.username || 'Người dùng' } : null,
    reactions: Array.from(groups, ([emoji, userIds]) => ({ emoji, count: userIds.length, userIds })),
    attachments,
  }
}
