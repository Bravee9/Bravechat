import { Prisma } from '@prisma/client'
import { prisma } from '../config/prisma'
export interface ChannelActivity { channelId: string; serverId: string; unreadCount: number; mentionCount: number }
// Tính từ DB để badge tồn tại sau reload và giống nhau giữa các thiết bị.
// Khi chưa có mốc đọc, chỉ tính tin từ lúc tham gia; bỏ tin của mình và tin đã xóa.
export async function unreadActivity(userId: string, serverId?: string) {
  return prisma.$queryRaw<ChannelActivity[]>`
    SELECT c.id AS "channelId", c.server_id AS "serverId", COUNT(m.id)::int AS "unreadCount",
      COALESCE(SUM(CASE WHEN strpos(lower(COALESCE(m.content, '')), lower('@' || u.username)) > 0
        OR (u.display_name IS NOT NULL AND u.display_name <> '' AND strpos(lower(COALESCE(m.content, '')), lower('@' || u.display_name)) > 0)
        THEN 1 ELSE 0 END), 0)::int AS "mentionCount"
    FROM server_members sm JOIN channels c ON c.server_id = sm.server_id JOIN users u ON u.id = sm.user_id
    LEFT JOIN channel_read_states r ON r.channel_id = c.id AND r.user_id = sm.user_id
    LEFT JOIN messages m ON m.channel_id = c.id AND m.is_deleted = false AND m.author_id <> sm.user_id
      AND m.created_at > COALESCE(r.last_read_at, sm.joined_at)
    WHERE sm.user_id = ${userId} AND sm.is_banned = false ${serverId ? Prisma.sql`AND c.server_id = ${serverId}` : Prisma.empty}
    GROUP BY c.id, c.server_id
  `
}
export function serverActivity(rows: ChannelActivity[], serverId: string) {
  const channels = rows.filter((row) => row.serverId === serverId)
  return { hasUnread: channels.some((row) => row.unreadCount > 0), mentionCount: channels.reduce((sum, row) => sum + row.mentionCount, 0) }
}
