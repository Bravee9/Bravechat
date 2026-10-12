import type { UserSummary } from "./user";

/** Mirrors `enum MessageType` in schema.prisma */
export type MessageType = "DEFAULT" | "REPLY" | "JOIN" | "LEAVE" | "BOOST" | "SYSTEM";

export interface Message {
  id: string;
  channelId: string;
  author: UserSummary;
  content: string | null;
  type: MessageType;
  /** ISO 8601. Format on the client, never on the server. */
  createdAt: string;
  editedAt: string | null;
  isPinned: boolean;
  replyToId: string | null;
  /** Client-generated id for optimistic UI de-duplication. */
  nonce: string | null;
}

/** Cursor pagination for message history: `?before=<messageId>&limit=50`. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
