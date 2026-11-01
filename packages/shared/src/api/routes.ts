/**
 * Single source of truth for REST paths (relative to the `/api` prefix).
 *
 * Backend: register Fastify routes with these paths.
 * Frontend: services call `http.get(API_ROUTES.servers.detail(id))`.
 *
 * Paths marked PROPOSED are not yet in docs/api-reference.md — they are what the
 * web client needs; add them to the docs when you implement them.
 */

const enc = encodeURIComponent;

export const API_ROUTES = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/auth/me",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  users: {
    byId: (userId: string) => `/users/${enc(userId)}`,
    me: "/users/@me",
    /** PROPOSED — servers the current user belongs to, for the server rail. */
    myServers: "/users/@me/servers",
    /** PROPOSED — 1-1 conversations for the "@me" sidebar. */
    myConversations: "/users/@me/conversations",
    friends: "/users/@me/friends",
    friend: (id: string) => `/users/@me/friends/${enc(id)}`,
    block: "/users/@me/friends/block",
  },
  servers: {
    create: "/servers",
    /** Includes categories + channels (see `ServerDetail`). */
    detail: (serverId: string) => `/servers/${enc(serverId)}`,
    members: (serverId: string) => `/servers/${enc(serverId)}/members`,
    channels: (serverId: string) => `/servers/${enc(serverId)}/channels`,
    createInvite: (serverId: string) => `/servers/${enc(serverId)}/invites`,
    leave: (serverId: string) => `/servers/${enc(serverId)}/members/@me`,
  },
  channels: {
    detail: (channelId: string) => `/channels/${enc(channelId)}`,
    /** `?before=<messageId>&limit=50` → `CursorPage<Message>` */
    messages: (channelId: string) => `/channels/${enc(channelId)}/messages`,
    typing: (channelId: string) => `/channels/${enc(channelId)}/typing`,
    read: (channelId: string) => `/channels/${enc(channelId)}/read`,
  },
  invites: {
    join: (code: string) => `/invites/${enc(code)}`,
  },
  uploads: {
    presign: "/uploads/presign",
    confirm: "/uploads/confirm",
  },
  messages: {
    detail: (id: string) => `/messages/${enc(id)}`,
    reactions: (id: string) => `/messages/${enc(id)}/reactions`,
    dm: (userId: string) => `/messages/dm/${enc(userId)}`,
    dmMessage: (userId: string, id: string) => `/messages/dm/${enc(userId)}/${enc(id)}`,
  },
} as const;
