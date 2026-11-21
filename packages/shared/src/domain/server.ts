import type { Channel, ChannelCategory } from "./channel";

/** One icon in the server rail (left-most vertical bar). */
export interface ServerListItem {
  id: string;
  name: string;
  /** Public R2 URL resolved from `iconKey`. null → rail shows the name's initials. */
  iconUrl: string | null;
  badgeColor?: string | null;
  /** Per-user read state: small pill on the left of the icon. */
  hasUnread: boolean;
  /** Red badge on the icon. 0 = hidden. */
  mentionCount: number;
}

/** `GET /servers/:serverId` — everything the channel sidebar needs in one call. */
export interface ServerDetail {
  id: string;
  name: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  badgeColor?: string | null;
  isPublic?: boolean;
  description: string | null;
  ownerId: string;
  memberPermissions?: Record<import("../permissions").PermissionKey, boolean>;
  highestRolePosition?: number;
  categories: ChannelCategory[];
  channels: Channel[];
}

/** Public member row returned by GET /servers/:serverId/members. */
export interface ServerMemberSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: import("./user").UserStatus;
  customStatus: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "BOT";
  roleIds?: string[];
}

export interface RoleSummary {
  id: string;
  serverId: string;
  name: string;
  color: string;
  position: number;
  permissions: Record<import("../permissions").PermissionKey, boolean>;
  isManaged: boolean;
  memberCount: number;
}

export interface ServerAnalytics {
  summary: {
    totalMembers: number;
    onlineMembers: number;
    totalChannels: number;
    privateChannels: number;
    totalMessages: number;
    totalAttachments: number;
    totalAttachmentBytes: number;
  };
  messagesByChannel: Array<{
    channelId: string;
    channelName: string;
    channelType: string;
    isPrivate: boolean;
    messageCount: number;
    lastMessageAt: string | null;
  }>;
  topContributors: Array<{
    userId: string;
    username: string;
    displayName: string | null;
    messageCount: number;
    rank: number;
  }>;
  attachmentsByType: Array<{
    type: string;
    fileCount: number;
    totalBytes: number;
  }>;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
  };
}

export interface SearchMessageResult {
  id: string;
  channelId: string;
  channelName: string;
  content: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
}
