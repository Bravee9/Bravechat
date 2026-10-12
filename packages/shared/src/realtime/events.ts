/**
 * WebSocket contract — typed to match what apps/api/src/routes/websocket.routes.ts
 * sends and accepts TODAY.
 *
 * Target contract (docs/api-reference.md): auth via `?token=`, no `user` in payloads,
 * `nonce` on send_message, `message_create` carrying a full `Message`. The optional
 * fields below let both versions co-exist while the backend migrates.
 */

/** Identity the client currently sends (will be replaced by the JWT on the socket). */
export interface WsUserRef {
  id?: string;
  username: string;
  /** 2-letter initials used as a text avatar. */
  avatar?: string;
}

/** Message shape the API currently broadcasts (pre-`Message` DTO). */
export interface WsChatMessage {
  id: string;
  channelId: string;
  content: string;
  /** Pre-formatted label from the server — prefer `createdAt`. */
  time: string;
  createdAt: string;
  /** Display name of the author. */
  user: string;
  avatar: string;
  isHighlighted?: boolean;
  nonce?: string;
}

// ─── Client → Server ──────────────────────────────────────────

export type ClientEvent =
  | { type: "join_channel"; channelId: string; user?: WsUserRef }
  | { type: "leave_channel"; channelId: string }
  | { type: "send_message"; channelId: string; content: string; nonce?: string; user?: WsUserRef }
  | { type: "typing_start"; channelId: string; username?: string }
  | { type: "typing_stop"; channelId: string; username?: string };

// ─── Server → Client ──────────────────────────────────────────

export type ServerEvent =
  | { type: "connected"; message: string; timestamp: string }
  | { type: "channel_joined"; channelId: string; messages: WsChatMessage[] }
  | { type: "message_create"; channelId: string; message: WsChatMessage; echoBack?: boolean }
  | { type: "typing_start"; channelId: string; username: string }
  | { type: "typing_stop"; channelId: string; username: string };

export type ServerEventType = ServerEvent["type"];
export type ServerEventOf<T extends ServerEventType> = Extract<ServerEvent, { type: T }>;

const SERVER_EVENT_TYPES: ReadonlySet<string> = new Set<ServerEventType>([
  "connected",
  "channel_joined",
  "message_create",
  "typing_start",
  "typing_stop",
]);

/** Parse a raw socket frame. Returns null for malformed or unknown events. */
export function parseServerEvent(raw: string): ServerEvent | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (
      typeof data === "object" &&
      data !== null &&
      "type" in data &&
      typeof (data as { type: unknown }).type === "string" &&
      SERVER_EVENT_TYPES.has((data as { type: string }).type)
    ) {
      return data as ServerEvent;
    }
    return null;
  } catch {
    return null;
  }
}
