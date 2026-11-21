"use client";

import { useEffect } from "react";
import type {
  CurrentUser,
  DirectConversation,
  ServerDetail,
  ServerListItem,
  ServerMemberSummary,
} from "@discord-clone/shared";
import { createStore, useStore } from "@/lib/store";
import { serverService } from "@/services/server.service";
import { channelService } from "@/services/channel.service";
import { userService } from "@/services/user.service";
import { ApiError } from "@/services/http";

/**
 * Workspace store: nguồn dữ liệu duy nhất cho các Layer cố định (Rail, Sidebar, Profile).
 * Tương tự gói READY của Discord: tải một lần, các Layer chỉ ĐỌC, chuyển server = đổi
 * state client, không fetch lại và không nhấp nháy "Đang tải".
 */
interface WorkspaceState {
  servers: ServerListItem[] | null;
  conversations: DirectConversation[] | null;
  currentUser: CurrentUser | null;
  serverDetails: Record<string, ServerDetail>;
  serverMembers: Record<string, ServerMemberSummary[]>;
  error: string | null;
}

const DETAIL_STALE_MS = 60_000;

export const workspaceStore = createStore<WorkspaceState>({
  servers: null,
  conversations: null,
  currentUser: null,
  serverDetails: {},
  serverMembers: {},
  error: null,
});

// Chống gọi trùng (dedupe in-flight) và theo dõi độ tươi của cache.
const inflight = new Map<string, Promise<void>>();
const detailFetchedAt = new Map<string, number>();
const membersFetchedAt = new Map<string, number>();

function once(key: string, task: () => Promise<void>): Promise<void> {
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = task().catch((reason) => {
    workspaceStore.set({ error: reason instanceof Error ? reason.message : "Không thể tải dữ liệu." });
    if (reason instanceof ApiError && reason.status === 401) window.location.replace("/login");
  }).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function loadServers(force = false): Promise<void> {
  if (!force && workspaceStore.get().servers) return Promise.resolve();
  return once("servers", async () => {
    const servers = await serverService.getMyServers();
    workspaceStore.set({ servers });
  });
}

export function loadConversations(force = false): Promise<void> {
  if (!force && workspaceStore.get().conversations) return Promise.resolve();
  return once("conversations", async () => {
    const conversations = await channelService.getDirectConversations();
    workspaceStore.set({ conversations });
  });
}

export function loadCurrentUser(force = false): Promise<void> {
  if (!force && workspaceStore.get().currentUser) return Promise.resolve();
  return once("currentUser", async () => {
    const currentUser = await userService.getCurrentUser();
    workspaceStore.set({ currentUser });
  });
}

/**
 * Stale-while-revalidate: có cache thì hiển thị ngay, chỉ refetch nền khi đã cũ.
 */
export function loadServerDetail(serverId: string, force = false): Promise<void> {
  if (!serverId || serverId === "@me") return Promise.resolve();
  const cached = workspaceStore.get().serverDetails[serverId];
  const fetchedAt = detailFetchedAt.get(serverId) ?? 0;
  if (!force && cached && Date.now() - fetchedAt < DETAIL_STALE_MS) {
    return Promise.resolve();
  }
  return once(`server:${serverId}`, async () => {
    const detail = await serverService.getServerDetail(serverId);
    if (!detail) return;
    detailFetchedAt.set(serverId, Date.now());
    workspaceStore.set((state) => ({
      serverDetails: { ...state.serverDetails, [serverId]: detail },
    }));
  });
}

export function loadServerMembers(serverId: string, force = false): Promise<void> {
  if (!serverId || serverId === "@me") return Promise.resolve();
  const cached = workspaceStore.get().serverMembers[serverId];
  const fetchedAt = membersFetchedAt.get(serverId) ?? 0;
  if (!force && cached && Date.now() - fetchedAt < DETAIL_STALE_MS) {
    return Promise.resolve();
  }
  return once(`members:${serverId}`, async () => {
    const members = await serverService.getServerMembers(serverId);
    membersFetchedAt.set(serverId, Date.now());
    workspaceStore.set((state) => ({
      serverMembers: { ...state.serverMembers, [serverId]: members },
    }));
  });
}

export function getFirstCachedChannelId(serverId: string): string | null {
  const detail = workspaceStore.get().serverDetails[serverId];
  if (!detail?.channels?.length) return null;
  const first = detail.channels
    .slice()
    .sort((left, right) => left.position - right.position)[0];
  return first?.id ?? null;
}

export function getCachedChannelName(serverId: string, channelId: string): string | null {
  const state = workspaceStore.get();
  if (serverId === "@me") {
    const conv = state.conversations?.find(
      (item) => item.id === channelId || item.recipient.id === channelId
    );
    return conv ? conv.recipient.displayName || conv.recipient.username : null;
  }
  const detail = state.serverDetails[serverId];
  const channel = detail?.channels.find((item) => item.id === channelId);
  return channel?.name ?? null;
}

export function getCachedServerDetail(serverId: string): ServerDetail | null {
  if (!serverId || serverId === "@me") return null;
  return workspaceStore.get().serverDetails[serverId] ?? null;
}

export function applyChannelActivity(serverId: string, channelId: string, mention: boolean) {
  workspaceStore.set((state) => {
    const detail = state.serverDetails[serverId];
    const channel = detail?.channels.find((item) => item.id === channelId);
    const server = state.servers?.find((item) => item.id === serverId);
    return {
      ...(detail && channel ? {
        serverDetails: {
          ...state.serverDetails,
          [serverId]: {
            ...detail,
            channels: detail.channels.map((item) => item.id === channelId
              ? { ...item, hasUnread: true, mentionCount: item.mentionCount + (mention ? 1 : 0) }
              : item),
          },
        },
      } : {}),
      ...(server && state.servers ? {
        servers: state.servers.map((item) => item.id === serverId
          ? { ...item, hasUnread: true, mentionCount: item.mentionCount + (mention ? 1 : 0) }
          : item),
      } : {}),
    };
  });
}

export function markChannelRead(serverId: string, channelId: string) {
  workspaceStore.set((state) => {
    const detail = state.serverDetails[serverId];
    const channel = detail?.channels.find((item) => item.id === channelId);
    if (!detail || !channel) return {};
    const channels = detail.channels.map((item) => item.id === channelId
      ? { ...item, hasUnread: false, mentionCount: 0 }
      : item);
    const serverMentionCount = channels.reduce((total, item) => total + item.mentionCount, 0);
    const servers = state.servers?.map((server) => server.id === serverId
      ? { ...server, hasUnread: channels.some((item) => item.hasUnread), mentionCount: serverMentionCount }
      : server);
    return {
      serverDetails: { ...state.serverDetails, [serverId]: { ...detail, channels } },
      ...(servers ? { servers } : {}),
    };
  });
}

// ─── Hooks ────────────────────────────────────────────────

export function useServers(): ServerListItem[] {
  const servers = useStore(workspaceStore, (s) => s.servers);
  useEffect(() => {
    void loadServers();
  }, []);
  return servers ?? EMPTY_SERVERS;
}

export function useConversations(): DirectConversation[] {
  const conversations = useStore(workspaceStore, (s) => s.conversations);
  useEffect(() => {
    void loadConversations();
  }, []);
  return conversations ?? EMPTY_CONVERSATIONS;
}

export function useCurrentUser(): CurrentUser | null {
  const currentUser = useStore(workspaceStore, (s) => s.currentUser);
  useEffect(() => {
    void loadCurrentUser();
  }, []);
  return currentUser;
}

export function useServerDetail(serverId: string): ServerDetail | null {
  const detail = useStore(workspaceStore, (s) => s.serverDetails[serverId] ?? null);
  useEffect(() => {
    void loadServerDetail(serverId);
  }, [serverId]);
  return detail;
}

export function useServerMembers(serverId: string): ServerMemberSummary[] {
  const members = useStore(workspaceStore, (s) => s.serverMembers[serverId]);
  useEffect(() => {
    if (serverId && serverId !== "@me") {
      void loadServerMembers(serverId);
    }
  }, [serverId]);
  return members ?? EMPTY_MEMBERS;
}

// Tham chiếu rỗng ổn định để tránh re-render thừa.
const EMPTY_SERVERS: ServerListItem[] = [];
const EMPTY_CONVERSATIONS: DirectConversation[] = [];
const EMPTY_MEMBERS: ServerMemberSummary[] = [];
