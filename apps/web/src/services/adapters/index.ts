/**
 * services/adapters/index.ts
 * Language-agnostic Frontend Service Adapter Layer.
 * Decouples React UI components from underlying backend service implementations
 * (Node.js Fastify today; Java Spring Boot or Rust Axum/Tokio in the future).
 */

import {
  API_ROUTES,
  type AuditLogEntry,
  type Channel,
  type CurrentUser,
  type DirectConversation,
  type FriendLists,
  type RoleSummary,
  type SearchMessageResult,
  type ServerAnalytics,
  type ServerDetail,
  type ServerListItem,
  type ServerMemberSummary,
  type UserSummary,
} from "@discord-clone/shared";
import { http } from "@/services/http";
import type { PermissionKey } from "@discord-clone/shared";

export const authAdapter = {
  getCurrentUser: () => http.get<{ user: CurrentUser }>(API_ROUTES.auth.me),
  logout: () => http.post(API_ROUTES.auth.logout),
  refresh: () => http.post(API_ROUTES.auth.refresh),
};

export const userAdapter = {
  getProfile: (userId: string) =>
    http.get<{ user: UserSummary & { bio?: string | null; customStatus?: string | null } }>(
      `/users/${encodeURIComponent(userId)}`
    ),
  updateProfile: (payload: {
    username?: string;
    displayName?: string | null;
    bio?: string | null;
    status?: CurrentUser["status"];
  }) => http.patch<{ user: CurrentUser }>("/users/@me", payload),
  updateStatus: (status: CurrentUser["status"]) =>
    http.patch<{ user: CurrentUser }>("/users/@me/status", { status }),
  searchByUsername: (username: string, exact = true) =>
    http.get<{ users: Array<{ id: string; username: string }> }>("/users/search", {
      query: { username, exact: exact ? "true" : "false" },
    }),
};

export const friendAdapter = {
  listAll: () => http.get<FriendLists>("/users/@me/friends"),
  sendRequest: (username: string) =>
    http.post("/users/@me/friends", { username }),
  respondRequest: (friendshipId: string, action: "accept" | "reject") =>
    http.put(`/users/@me/friends/${encodeURIComponent(friendshipId)}`, { action }),
  removeOrUnblock: (friendshipId: string) =>
    http.delete(`/users/@me/friends/${encodeURIComponent(friendshipId)}`),
  blockUser: (userId: string) =>
    http.post("/users/@me/friends/block", { userId }),
};

export const serverAdapter = {
  listMyServers: () => http.get<ServerListItem[]>(API_ROUTES.users.myServers),
  getDetail: (serverId: string) =>
    http.get<ServerDetail>(API_ROUTES.servers.detail(serverId)),
  create: (name: string) =>
    http.post<{ server: ServerDetail }>(API_ROUTES.servers.create, { name }),
  update: (
    serverId: string,
    payload: {
      name?: string;
      description?: string | null;
      badgeColor?: string | null;
      isPublic?: boolean;
    }
  ) => http.patch<{ server: ServerDetail }>(API_ROUTES.servers.detail(serverId), payload),
  delete: (serverId: string) =>
    http.delete(API_ROUTES.servers.detail(serverId)),
  leave: (serverId: string) =>
    http.delete(API_ROUTES.servers.leave(serverId)),
  listMembers: (serverId: string) =>
    http.get<{ members: ServerMemberSummary[] }>(API_ROUTES.servers.members(serverId)),
  createInvite: (serverId: string) =>
    http.post<{ invite: { code: string; expiresAt: string } }>(
      API_ROUTES.servers.createInvite(serverId)
    ),
  joinByInvite: (code: string) =>
    http.post<{ serverId: string }>(API_ROUTES.invites.join(code)),
  listRoles: (serverId: string) =>
    http.get<{ roles: RoleSummary[] }>(API_ROUTES.servers.roles(serverId)),
  createRole: (
    serverId: string,
    payload: {
      name: string;
      color?: string;
      permissions?: Partial<Record<PermissionKey, boolean>>;
    }
  ) => http.post<{ role: RoleSummary }>(API_ROUTES.servers.roles(serverId), payload),
  updateRole: (
    serverId: string,
    roleId: string,
    payload: {
      name?: string;
      color?: string;
      permissions?: Partial<Record<PermissionKey, boolean>>;
    }
  ) =>
    http.patch<{ role: RoleSummary }>(
      API_ROUTES.servers.roleDetail(serverId, roleId),
      payload
    ),
  deleteRole: (serverId: string, roleId: string) =>
    http.delete(API_ROUTES.servers.roleDetail(serverId, roleId)),
  assignMemberRoles: (serverId: string, userId: string, roleIds: string[]) =>
    http.put(API_ROUTES.servers.memberRoles(serverId, userId), { roleIds }),
  kickMember: (serverId: string, userId: string) =>
    http.post(API_ROUTES.servers.kickMember(serverId, userId)),
  banMember: (serverId: string, userId: string, reason?: string) =>
    http.post(API_ROUTES.servers.banMember(serverId, userId), reason ? { reason } : {}),
  getAnalytics: (serverId: string) =>
    http.get<ServerAnalytics>(API_ROUTES.servers.analytics(serverId)),
  getAuditLogs: (serverId: string) =>
    http.get<{ logs: AuditLogEntry[] }>(API_ROUTES.servers.auditLogs(serverId)),
  searchMessages: (serverId: string, q: string) =>
    http.get<{ results: SearchMessageResult[] }>(
      API_ROUTES.servers.searchMessages(serverId),
      { query: { q } }
    ),
};

export const channelAdapter = {
  listDirectConversations: () =>
    http.get<DirectConversation[]>(API_ROUTES.users.myConversations),
  getChannel: (channelId: string) =>
    http.get<{ channel: Channel }>(`/channels/${encodeURIComponent(channelId)}`),
  createChannel: (
    serverId: string,
    payload: {
      name: string;
      type?: "TEXT" | "VOICE" | "VIDEO";
      categoryId?: string;
      isPrivate?: boolean;
      allowedRoleIds?: string[];
    }
  ) =>
    http.post<{ channel: Channel }>(
      API_ROUTES.servers.channels(serverId),
      payload
    ),
  updateChannel: (
    serverId: string,
    channelId: string,
    payload: {
      name?: string;
      topic?: string | null;
      isPrivate?: boolean;
      allowedRoleIds?: string[];
    }
  ) =>
    http.patch<{ channel: Channel }>(
      API_ROUTES.servers.channelDetail(serverId, channelId),
      payload
    ),
  deleteChannel: (serverId: string, channelId: string) =>
    http.delete(API_ROUTES.servers.channelDetail(serverId, channelId)),
  markRead: (channelId: string) =>
    http.post(`/channels/${encodeURIComponent(channelId)}/read`),
};
