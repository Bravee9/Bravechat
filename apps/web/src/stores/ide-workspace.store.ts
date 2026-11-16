"use client";

import { createStore, useStore } from "@/lib/store";

export const JETBRAINS_PALETTE = [
  { hex: "#087CFA", name: "JetBrains Blue" },
  { hex: "#07C3F2", name: "Cyan" },
  { hex: "#21D789", name: "Emerald" },
  { hex: "#3DEA62", name: "Neon Green" },
  { hex: "#6B57FF", name: "Indigo" },
  { hex: "#AF1DF5", name: "Purple" },
  { hex: "#FF45ED", name: "Magenta" },
  { hex: "#FF318C", name: "Pink" },
  { hex: "#DD1265", name: "Crimson" },
  { hex: "#FE2857", name: "Red" },
  { hex: "#FC801D", name: "Orange" },
  { hex: "#FDB60D", name: "Amber" },
  { hex: "#FCF84A", name: "Yellow" },
  { hex: "#CDCDCD", name: "Light Gray" },
  { hex: "#7D7D7D", name: "Slate Gray" },
] as const;

export type PermissionKey =
  | "manage_server"
  | "manage_channels"
  | "manage_roles"
  | "view_audit_log"
  | "invite_members"
  | "kick_members"
  | "ban_members"
  | "send_messages"
  | "attach_files"
  | "manage_messages"
  | "pin_messages"
  | "connect_voice"
  | "speak_voice"
  | "share_screen"
  | "access_private_channels";

export interface RoleDefinition {
  id: string;
  name: string;
  color: string;
  isSystem?: boolean;
  permissions: Record<PermissionKey, boolean>;
}

export interface ChannelPolicy {
  isPrivate: boolean;
  allowedRoleIds: string[];
  topic?: string;
}

export interface ServerWorkspaceConfig {
  badgeColor?: string;
  description?: string;
  visibility: "PRIVATE" | "INVITE_ONLY" | "PUBLIC";
  roles: RoleDefinition[];
  channelPolicies: Record<string, ChannelPolicy>;
  memberRoleOverrides: Record<string, string>;
  kickedMemberIds: string[];
  bannedMemberIds: string[];
}

export type WorkspaceModalTab =
  | "overview"
  | "channels"
  | "members"
  | "roles";

interface IdeWorkspaceState {
  configs: Record<string, ServerWorkspaceConfig>;
  /** Role simulation to test private channel access guard in real time */
  previewAsRoleId: string | null;
  activeModal: {
    serverId: string;
    tab: WorkspaceModalTab;
  } | null;
}

const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: "OWNER",
    name: "Owner",
    color: "#FE2857",
    isSystem: true,
    permissions: {
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
    },
  },
  {
    id: "ADMIN",
    name: "Admin",
    color: "#087CFA",
    isSystem: true,
    permissions: {
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
    },
  },
  {
    id: "MODERATOR",
    name: "Moderator",
    color: "#21D789",
    isSystem: false,
    permissions: {
      manage_server: false,
      manage_channels: false,
      manage_roles: false,
      view_audit_log: true,
      invite_members: true,
      kick_members: true,
      ban_members: false,
      send_messages: true,
      attach_files: true,
      manage_messages: true,
      pin_messages: true,
      connect_voice: true,
      speak_voice: true,
      share_screen: true,
      access_private_channels: true,
    },
  },
  {
    id: "MEMBER",
    name: "Member",
    color: "#CDCDCD",
    isSystem: true,
    permissions: {
      manage_server: false,
      manage_channels: false,
      manage_roles: false,
      view_audit_log: false,
      invite_members: true,
      kick_members: false,
      ban_members: false,
      send_messages: true,
      attach_files: true,
      manage_messages: false,
      pin_messages: false,
      connect_voice: true,
      speak_voice: true,
      share_screen: true,
      access_private_channels: false,
    },
  },
];

export function getDeterministicJetBrainsColor(seed: string): string {
  const badgeColors = [
    "#21D789",
    "#087CFA",
    "#6B57FF",
    "#FDB60D",
    "#FC801D",
    "#FE2857",
    "#AF1DF5",
    "#07C3F2",
    "#3DEA62",
    "#FF318C",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return badgeColors[hash % badgeColors.length];
}

// Cache default server configs by serverId so useSyncExternalStore getSnapshot returns a stable reference
const defaultConfigCache = new Map<string, ServerWorkspaceConfig>();

export function createDefaultServerConfig(serverId: string): ServerWorkspaceConfig {
  const cached = defaultConfigCache.get(serverId);
  if (cached) return cached;
  const created: ServerWorkspaceConfig = {
    badgeColor: getDeterministicJetBrainsColor(serverId),
    description: "Không gian làm việc chung cho các thành viên trong máy chủ.",
    visibility: "INVITE_ONLY",
    roles: DEFAULT_ROLES.map((r) => ({
      ...r,
      permissions: { ...r.permissions },
    })),
    channelPolicies: {},
    memberRoleOverrides: {},
    kickedMemberIds: [],
    bannedMemberIds: [],
  };
  defaultConfigCache.set(serverId, created);
  return created;
}

export const ideWorkspaceStore = createStore<IdeWorkspaceState>({
  configs: {},
  previewAsRoleId: null,
  activeModal: null,
});

export function getServerWorkspaceConfig(serverId: string): ServerWorkspaceConfig {
  const existing = ideWorkspaceStore.get().configs[serverId];
  if (existing) return existing;
  return createDefaultServerConfig(serverId);
}

export function updateServerWorkspaceConfig(
  serverId: string,
  updater: (prev: ServerWorkspaceConfig) => ServerWorkspaceConfig
) {
  ideWorkspaceStore.set((state) => {
    const current = state.configs[serverId] ?? createDefaultServerConfig(serverId);
    const next = updater(current);
    return {
      configs: {
        ...state.configs,
        [serverId]: next,
      },
    };
  });
}

export function openWorkspaceModal(serverId: string, tab: WorkspaceModalTab = "overview") {
  ideWorkspaceStore.set({
    activeModal: { serverId, tab },
  });
}

export function closeWorkspaceModal() {
  ideWorkspaceStore.set({ activeModal: null });
}

export function setPreviewAsRole(roleId: string | null) {
  ideWorkspaceStore.set({ previewAsRoleId: roleId });
}

export function useServerWorkspaceConfig(serverId: string): ServerWorkspaceConfig {
  return useStore(
    ideWorkspaceStore,
    (state) => state.configs[serverId] ?? createDefaultServerConfig(serverId)
  );
}

export function useActiveWorkspaceModal() {
  return useStore(ideWorkspaceStore, (state) => state.activeModal);
}

export function usePreviewAsRoleId() {
  return useStore(ideWorkspaceStore, (state) => state.previewAsRoleId);
}
