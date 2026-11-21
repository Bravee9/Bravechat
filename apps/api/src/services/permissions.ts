import type { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'

export type PermissionKey =
  | 'manage_server'
  | 'manage_channels'
  | 'manage_roles'
  | 'view_audit_log'
  | 'invite_members'
  | 'kick_members'
  | 'ban_members'
  | 'send_messages'
  | 'attach_files'
  | 'manage_messages'
  | 'pin_messages'
  | 'connect_voice'
  | 'speak_voice'
  | 'share_screen'
  | 'access_private_channels'

export const PERMISSION_BITS: Record<PermissionKey, number> = {
  manage_server: 1 << 0,
  manage_channels: 1 << 1,
  manage_roles: 1 << 2,
  view_audit_log: 1 << 3,
  invite_members: 1 << 4,
  kick_members: 1 << 5,
  ban_members: 1 << 6,
  send_messages: 1 << 7,
  attach_files: 1 << 8,
  manage_messages: 1 << 9,
  pin_messages: 1 << 10,
  connect_voice: 1 << 11,
  speak_voice: 1 << 12,
  share_screen: 1 << 13,
  access_private_channels: 1 << 14,
}

export function permissionsToBitmask(perms: Partial<Record<PermissionKey, boolean>>): string {
  let mask = 0
  for (const [key, bit] of Object.entries(PERMISSION_BITS)) {
    if (perms[key as PermissionKey]) mask |= bit
  }
  return String(mask)
}

export function bitmaskToPermissions(maskInput: string | number | bigint): Record<PermissionKey, boolean> {
  const mask = Number(maskInput)
  const result = {} as Record<PermissionKey, boolean>
  for (const [key, bit] of Object.entries(PERMISSION_BITS)) {
    result[key as PermissionKey] = (mask & bit) === bit
  }
  return result
}

type DbClient = Prisma.TransactionClient | typeof prisma

const PERM_CACHE_TTL_MS = 5_000
const MAX_PERM_CACHE_ENTRIES = 2_000

type MemberPermissionResult = NonNullable<
  Awaited<ReturnType<typeof fetchMemberPermissionsFromDb>>
>
type ChannelAccessResult = NonNullable<
  Awaited<ReturnType<typeof fetchChannelAccessFromDb>>
>

const memberPermCache = new Map<
  string,
  { expiresAt: number; value: MemberPermissionResult | null }
>()
const channelAccessCache = new Map<
  string,
  { expiresAt: number; serverId: string; value: ChannelAccessResult | null }
>()

export function invalidateServerPermissionsCache(serverId?: string) {
  if (!serverId) {
    memberPermCache.clear()
    channelAccessCache.clear()
    return
  }
  const prefix = `${serverId}:`
  for (const key of memberPermCache.keys()) {
    if (key.startsWith(prefix)) memberPermCache.delete(key)
  }
  for (const [key, entry] of channelAccessCache.entries()) {
    if (entry.serverId === serverId) channelAccessCache.delete(key)
  }
}

function pruneCache<T>(map: Map<string, T>) {
  if (map.size <= MAX_PERM_CACHE_ENTRIES) return
  const firstKey = map.keys().next().value
  if (firstKey !== undefined) map.delete(firstKey)
}

export function hexToRgbInt(hex: string): number {
  const clean = hex.replace('#', '')
  const parsed = Number.parseInt(clean, 16)
  return Number.isNaN(parsed) ? 0x087cfa : parsed
}

export function rgbIntToHex(color: number): string {
  return `#${(color >>> 0).toString(16).padStart(6, '0').slice(-6).toUpperCase()}`
}

export async function ensureDefaultServerRoles(
  db: DbClient,
  serverId: string,
  ownerMemberId?: string
) {
  const existing = await db.role.findMany({
    where: { serverId },
    orderBy: { position: 'desc' },
  })
  if (existing.length > 0) return existing

  const ownerMask = BigInt(
    permissionsToBitmask({
      manage_server: true,
      manage_channels: true,
      manage_roles: true,
      view_audit_log: true,
      invite_members: true,
      kick_members: true,
      ban_members: true,
      send_messages: true,
      attach_files: true,
      manage_messages: true,
      pin_messages: true,
      connect_voice: true,
      speak_voice: true,
      share_screen: true,
      access_private_channels: true,
    })
  )
  const adminMask = ownerMask
  const modMask = BigInt(
    permissionsToBitmask({
      view_audit_log: true,
      invite_members: true,
      kick_members: true,
      send_messages: true,
      attach_files: true,
      manage_messages: true,
      pin_messages: true,
      connect_voice: true,
      speak_voice: true,
      share_screen: true,
      access_private_channels: true,
    })
  )
  const memberMask = BigInt(
    permissionsToBitmask({
      invite_members: true,
      send_messages: true,
      attach_files: true,
      connect_voice: true,
      speak_voice: true,
      share_screen: true,
    })
  )

  const ownerRole = await db.role.create({
    data: {
      serverId,
      name: 'Owner',
      color: hexToRgbInt('#FE2857'),
      position: 100,
      permissions: ownerMask,
      isManaged: true,
    },
  })
  const adminRole = await db.role.create({
    data: {
      serverId,
      name: 'Admin',
      color: hexToRgbInt('#087CFA'),
      position: 80,
      permissions: adminMask,
      isManaged: true,
    },
  })
  const modRole = await db.role.create({
    data: {
      serverId,
      name: 'Moderator',
      color: hexToRgbInt('#21D789'),
      position: 50,
      permissions: modMask,
      isManaged: false,
    },
  })
  const memberRole = await db.role.create({
    data: {
      serverId,
      name: 'Member',
      color: hexToRgbInt('#CDCDCD'),
      position: 0,
      permissions: memberMask,
      isManaged: true,
    },
  })

  if (ownerMemberId) {
    await db.memberRole.upsert({
      where: { memberId_roleId: { memberId: ownerMemberId, roleId: ownerRole.id } },
      create: { memberId: ownerMemberId, roleId: ownerRole.id },
      update: {},
    })
  }

  return [ownerRole, adminRole, modRole, memberRole]
}

export async function getMemberPermissions(serverId: string, userId: string) {
  const cacheKey = `${serverId}:${userId}`
  const now = Date.now()
  const cached = memberPermCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }
  const value = await fetchMemberPermissionsFromDb(serverId, userId)
  if (value) {
    pruneCache(memberPermCache)
    memberPermCache.set(cacheKey, { expiresAt: now + PERM_CACHE_TTL_MS, value })
  } else {
    memberPermCache.delete(cacheKey)
  }
  return value
}

async function fetchMemberPermissionsFromDb(serverId: string, userId: string) {
  const member = await prisma.serverMember.findFirst({
    where: { serverId, userId, isBanned: false },
    include: {
      roles: {
        include: {
          role: { select: { id: true, name: true, position: true, permissions: true } },
        },
      },
    },
  })
  if (!member) return null

  let mask = 0
  let highestRolePosition = member.isOwner ? 1000 : 0
  const roleIds: string[] = []
  for (const mr of member.roles) {
    roleIds.push(mr.role.id)
    mask |= Number(mr.role.permissions)
    if (!member.isOwner && mr.role.position > highestRolePosition) {
      highestRolePosition = mr.role.position
    }
  }

  const effectiveMask = member.isOwner ? 0x7fff : mask
  const permissions = bitmaskToPermissions(effectiveMask)

  const hasPermission = (key: PermissionKey) => {
    if (member.isOwner) return true
    const bit = PERMISSION_BITS[key]
    return (mask & bit) === bit
  }

  return {
    member,
    isOwner: member.isOwner,
    roleIds,
    mask: effectiveMask,
    highestRolePosition,
    permissions,
    hasPermission,
  }
}

export async function canAccessChannel(channelId: string, userId: string) {
  const cacheKey = `${channelId}:${userId}`
  const now = Date.now()
  const cached = channelAccessCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }
  const result = await fetchChannelAccessFromDb(channelId, userId)
  if (result) {
    pruneCache(channelAccessCache)
    channelAccessCache.set(cacheKey, {
      expiresAt: now + PERM_CACHE_TTL_MS,
      serverId: result.serverId,
      value: result,
    })
  } else {
    channelAccessCache.delete(cacheKey)
  }
  return result
}

export function canMemberViewPrivateChannel(
  perms: {
    isOwner: boolean
    roleIds: string[]
    hasPermission: (key: PermissionKey) => boolean
  },
  channel: {
    isPrivate?: boolean
    rolePermissions?: Array<{ roleId: string }>
  }
) {
  if (!channel.isPrivate || perms.isOwner) return true
  if (perms.hasPermission('access_private_channels')) return true
  return Boolean(channel.rolePermissions?.some((rp) => perms.roleIds.includes(rp.roleId)))
}

async function fetchChannelAccessFromDb(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      name: true,
      type: true,
      serverId: true,
      userLimit: true,
      isPrivate: true,
      rolePermissions: {
        where: { canView: true },
        select: { roleId: true },
      },
    },
  })
  if (!channel) return null

  const perms = await getMemberPermissions(channel.serverId, userId)
  if (!perms) return null

  if (!canMemberViewPrivateChannel(perms, channel)) {
    return null
  }

  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    serverId: channel.serverId,
    userLimit: channel.userLimit,
    isPrivate: channel.isPrivate,
  }
}

export async function writeAuditLog(
  db: DbClient,
  serverId: string,
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  detail?: string | null
) {
  invalidateServerPermissionsCache(serverId)
  await db.auditLog.create({
    data: {
      serverId,
      actorId,
      action,
      targetType,
      targetId: targetId ?? null,
      detail: detail ?? null,
    },
  })
}
