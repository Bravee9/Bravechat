import { RoomServiceClient, TrackSource, type ParticipantInfo } from 'livekit-server-sdk'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import type { FastifyInstance } from 'fastify'
import { fail } from './conversation'

export const voiceRoomName = (channelId: string, epoch: number) => `channel:${channelId}:${epoch}`

export async function registerVoiceToken(channelId: string, sessionId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    // The no-op increment locks the channel while its generation is leased.
    const channel = await tx.channel.update({ where: { id: channelId }, data: { voiceEpoch: { increment: 0 } }, select: { voiceEpoch: true } })
    if (!await tx.refreshToken.findFirst({ where: { id: sessionId, userId, isRevoked: false, expiresAt: { gt: new Date() } }, select: { id: true } })) throw fail(401, 'Phiên đăng nhập đã hết hạn.')
    const key = { channelId, sessionId, epoch: channel.voiceEpoch }
    await tx.voiceSession.upsert({ where: { channelId_sessionId_epoch: key }, create: key, update: {} })
    return voiceRoomName(channelId, channel.voiceEpoch)
  })
}

let client: RoomServiceClient | undefined
function roomService() {
  if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) return undefined
  return client ??= new RoomServiceClient(env.LIVEKIT_API_URL || env.LIVEKIT_URL, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, { requestTimeout: 5 })
}
function claims(participant: Pick<ParticipantInfo, 'identity' | 'metadata'>) {
  try {
    const metadata: unknown = JSON.parse(participant.metadata)
    if (!metadata || typeof metadata !== 'object' || !('sid' in metadata) || typeof metadata.sid !== 'string' || !('channelId' in metadata) || typeof metadata.channelId !== 'string') return null
    const userId = participant.identity.split(':')[0]
    return userId && metadata.sid ? { userId, sid: metadata.sid, channelId: metadata.channelId } : null
  } catch { return null }
}
const missing = (error: unknown) => typeof error === 'object' && error !== null && (('status' in error && error.status === 404) || ('statusCode' in error && error.statusCode === 404) || ('code' in error && error.code === 'not_found'))
async function control<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation() } catch (error) {
    // SDK failures can embed a signed room-admin JWT in their message/stack.
    // Throw a new safe error, without a cause, before application logging.
    throw fail(missing(error) ? 404 : 503, 'Không thể cập nhật quyền phòng thoại. Vui lòng thử lại.')
  }
}
async function remove(room: string, identity: string) {
  const service = roomService()
  if (!service) return
  try { await control(() => service.removeParticipant(room, identity)) } catch (error) { if (!missing(error)) throw error }
}
async function access(room: string, participant: Pick<ParticipantInfo, 'identity' | 'metadata'>) {
  const value = claims(participant)
  if (!value) return null
  const session = await prisma.refreshToken.findFirst({ where: { id: value.sid, userId: value.userId, isRevoked: false, expiresAt: { gt: new Date() }, user: { isBanned: false } }, select: { id: true } })
  if (!session) return null
  const channel = await prisma.channel.findFirst({ where: { id: value.channelId, type: { in: ['VOICE', 'VIDEO'] }, server: { members: { some: { userId: value.userId, isBanned: false } } } }, select: { type: true, voiceEpoch: true } })
  if (!channel || room !== voiceRoomName(value.channelId, channel.voiceEpoch)) return null
  const lease = await prisma.voiceSession.findUnique({ where: { channelId_sessionId_epoch: { channelId: value.channelId, sessionId: value.sid, epoch: channel.voiceEpoch } } })
  return lease ? channel : null
}

// Tokens join with no media/data privileges. A signed webhook may grant them
// only after current DB authorization. Room generations additionally isolate
// cached privileged tokens refreshed by self-hosted LiveKit after admission.
export async function admitVoiceParticipant(room: string, participant: Pick<ParticipantInfo, 'identity' | 'metadata'>) {
  const channel = await access(room, participant)
  if (!channel) { await remove(room, participant.identity); return false }
  const service = roomService()
  if (!service) return false
  await control(() => service.updateParticipant(room, participant.identity, { permission: {
    canPublish: true, canSubscribe: true, canPublishData: true, canUpdateMetadata: false,
    canPublishSources: channel.type === 'VIDEO' ? [TrackSource.MICROPHONE, TrackSource.CAMERA] : [TrackSource.MICROPHONE],
  } }))
  // Cover a reset/membership change while the remote permission call was pending.
  if (!await access(room, participant)) { await remove(room, participant.identity); return false }
  return true
}

async function visit(userId: string, sid: string | undefined, serverId: string | undefined, action: (room: string, participant: ParticipantInfo) => Promise<void>) {
  const service = roomService()
  if (!service) return
  const allowed = serverId ? new Set((await prisma.channel.findMany({ where: { serverId }, select: { id: true, voiceEpoch: true } })).map((channel) => voiceRoomName(channel.id, channel.voiceEpoch))) : null
  for (const room of await control(() => service.listRooms())) {
    if (!room.name.startsWith('channel:') || (allowed && !allowed.has(room.name))) continue
    let participants: ParticipantInfo[]
    try { participants = await control(() => service.listParticipants(room.name)) } catch (error) { if (missing(error)) continue; throw error }
    for (const participant of participants) {
      if (!participant.identity.startsWith(`${userId}:`)) continue
      if (sid && claims(participant)?.sid !== sid) continue
      await action(room.name, participant)
    }
  }
}
async function invalidateChannels(ids: string[]) {
  for (const id of new Set(ids)) {
    const channel = await prisma.channel.update({ where: { id }, data: { voiceEpoch: { increment: 1 } }, select: { voiceEpoch: true } })
    const oldRoom = voiceRoomName(id, channel.voiceEpoch - 1)
    const service = roomService()
    if (service) { try { await control(() => service.deleteRoom(oldRoom)) } catch (error) { if (!missing(error)) throw error } }
  }
}
export async function revokeVoiceSessions(userId: string, sid?: string, serverId?: string) {
  if (!roomService()) return
  const leases = await prisma.voiceSession.findMany({ where: { ...(sid ? { sessionId: sid } : {}), session: { userId }, ...(serverId ? { channel: { serverId } } : {}) }, include: { channel: { select: { voiceEpoch: true } } } })
  await invalidateChannels(leases.filter((lease) => lease.epoch === lease.channel.voiceEpoch).map((lease) => lease.channelId))
}

// Refresh rotates the HTTP session without interrupting an authorized call.
// Cached pre-refresh tokens keep their old SID and fail webhook admission.
export async function rotateVoiceSession(userId: string, oldSid: string, newSid: string) {
  if (!roomService()) return
  await prisma.$transaction(async (tx) => {
    for (const lease of await tx.voiceSession.findMany({ where: { sessionId: oldSid, session: { userId } } })) {
      const key = { channelId: lease.channelId, sessionId: newSid, epoch: lease.epoch }
      await tx.voiceSession.upsert({ where: { channelId_sessionId_epoch: key }, create: key, update: {} })
    }
  })
  await visit(userId, oldSid, undefined, async (room, participant) => {
  try {
    const metadata = { ...JSON.parse(participant.metadata), sid: newSid }
    await control(() => roomService()!.updateParticipant(room, participant.identity, { metadata: JSON.stringify(metadata) }))
  } catch (error) { if (!missing(error)) throw error }
  })
}

// Retry obsolete-room cleanup after SFU outages/restarts. Also catches external
// bans/session changes that did not pass through the application revoke routes.
export async function reconcileVoiceRooms() {
  const service = roomService()
  if (!service) return
  for (const room of await control(() => service.listRooms())) {
    if (!room.name.startsWith('channel:')) continue
    const channelId = room.name.split(':')[1]
    const channel = await prisma.channel.findUnique({ where: { id: channelId }, select: { voiceEpoch: true } })
    if (!channel || room.name !== voiceRoomName(channelId, channel.voiceEpoch)) {
      try { await control(() => service.deleteRoom(room.name)) } catch (error) { if (!missing(error)) throw error }
      continue
    }
    for (const participant of await control(() => service.listParticipants(room.name))) {
      if (!await access(room.name, participant)) { await invalidateChannels([channelId]); break }
    }
  }
}
export function startVoiceSecurity(server: FastifyInstance) {
  if (!roomService()) return
  let running = false
  const reconcile = async () => {
    if (running) return
    running = true
    try { await reconcileVoiceRooms() } catch (error) { server.log.error(error, 'Voice authorization reconciliation failed') } finally { running = false }
  }
  server.addHook('onReady', reconcile)
  const timer = setInterval(() => { void reconcile() }, 10000)
  timer.unref()
  server.addHook('onClose', async () => { clearInterval(timer) })
}
