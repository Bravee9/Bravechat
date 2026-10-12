import type { UserSummary } from "./user";

/** Mirrors `enum ChannelType` in schema.prisma */
export type ChannelType = "TEXT" | "VOICE" | "VIDEO" | "ANNOUNCEMENT" | "STAGE" | "FORUM";

export interface ChannelCategory {
  id: string;
  serverId: string;
  name: string;
  position: number;
}

export interface Channel {
  id: string;
  serverId: string;
  /** null = channel sits above all categories (Discord behaviour). */
  categoryId: string | null;
  name: string;
  type: ChannelType;
  topic: string | null;
  position: number;
  /** Per-user read state, computed by the API. */
  hasUnread: boolean;
  mentionCount: number;
}

/** A 1-1 conversation shown in the "@me" sidebar. */
export interface DirectConversation {
  /** Used as the realtime room id and in the URL `/channels/@me/:id`. */
  id: string;
  recipient: UserSummary;
  lastMessageAt: string | null;
  hasUnread: boolean;
}
