"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  loadServerDetail,
  loadServers,
  useCurrentUser,
  useServerDetail,
  useServers,
} from "@/stores/workspace.store";
import { SettingsIcon } from "@/components/ui/Icons";
import {
  openWorkspaceModal,
  usePreviewAsRoleId,
  useServerWorkspaceConfig,
} from "@/stores/ide-workspace.store";
import { ServerHeader } from "./ServerHeader";
import { CategorySection } from "./CategorySection";
import { DialogFrame } from "@/components/ui/DialogFrame";
import { API_ROUTES } from "@discord-clone/shared";
import { http } from "@/services/http";

/**
 * LAYER 2 (nhánh server) — Danh sách kênh theo category (JetBrains IDE Project / Sessions Tree).
 * Đọc từ store (stale-while-revalidate): quay lại server đã xem thì hiển thị ngay,
 * không nhấp nháy "Đang tải".
 */
export function ServerChannelSidebar({ serverId }: { serverId: string }) {
  const params = useParams();
  const currentChannelId = (params?.channelId as string) || "general";

  const serverDetail = useServerDetail(serverId);
  const currentUser = useCurrentUser();
  const previewAsRoleId = usePreviewAsRoleId();
  const servers = useServers();
  const serverSummary = servers.find((s) => s.id === serverId);
  const config = useServerWorkspaceConfig(serverId);

  const isOwner = Boolean(
    currentUser?.id && serverDetail?.ownerId && currentUser.id === serverDetail.ownerId
  );
  const basePerms = serverDetail?.memberPermissions;
  const previewRole = previewAsRoleId
    ? config.roles.find((r) => r.id === previewAsRoleId)
    : null;

  const hasPerm = (key: import("@discord-clone/shared").PermissionKey) => {
    if (previewAsRoleId) {
      if (previewAsRoleId === "GUEST") return false;
      if (previewRole) return Boolean(previewRole.permissions[key]);
      return false;
    }
    if (isOwner) return true;
    if (basePerms) return Boolean(basePerms[key]);
    return true;
  };

  const canManageServer = hasPerm("manage_server");
  const canManageChannels = hasPerm("manage_channels");
  const canManageRoles = hasPerm("manage_roles");
  const canManageMembers = hasPerm("kick_members") || hasPerm("ban_members") || hasPerm("manage_roles");
  const canInvite = hasPerm("invite_members");
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<
    "invite" | "channel" | "leave" | "settings" | null
  >(null);
  const [channelName, setChannelName] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [serverName, setServerName] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const router = useRouter();

  async function saveServerSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setBusy(true);
    try {
      await http.patch(API_ROUTES.servers.detail(serverId), {
        name: serverName.trim(),
      });
      await Promise.all([loadServerDetail(serverId, true), loadServers(true)]);
      setDialogMode(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Không thể cập nhật máy chủ."
      );
    } finally {
      setBusy(false);
    }
  }

  async function createInvite() {
    setDialogMode("invite");
    setInviteUrl("");
    setActionError("");
    setInviteCopied(false);
    setBusy(true);
    try {
      const { invite } = await http.post<{
        invite: { code: string; expiresAt: string };
      }>(API_ROUTES.servers.createInvite(serverId));
      setInviteUrl(
        `${window.location.origin}/invite/${encodeURIComponent(invite.code)}`
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Không thể tạo mã mời."
      );
    } finally {
      setBusy(false);
    }
  }

  async function createChannel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setBusy(true);
    try {
      const { channel } = await http.post<{ channel: { id: string } }>(
        API_ROUTES.servers.channels(serverId),
        {
          name: channelName.trim(),
          type: "TEXT",
          categoryId,
        }
      );
      await loadServerDetail(serverId, true);
      setDialogMode(null);
      setChannelName("");
      router.push(
        `/channels/${encodeURIComponent(serverId)}/${encodeURIComponent(
          channel.id
        )}`,
        { scroll: false }
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Không thể tạo kênh."
      );
    } finally {
      setBusy(false);
    }
  }

  async function leaveServer() {
    setBusy(true);
    setActionError("");
    try {
      await http.delete(API_ROUTES.servers.leave(serverId));
      await loadServers(true);
      setDialogMode(null);
      router.replace("/channels/@me");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Không thể rời máy chủ."
      );
    } finally {
      setBusy(false);
    }
  }

  // Nhóm kênh theo category một lần (O(n)) và ẩn kênh riêng tư đối với vai trò không có quyền xem.
  const channelsByCategory = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<typeof serverDetail>["channels"]
    >();
    for (const channel of serverDetail?.channels ?? []) {
      const policy = config.channelPolicies[channel.id];
      const isPrivate = Boolean(channel.isPrivate || policy?.isPrivate);
      if (isPrivate && previewAsRoleId) {
        const allowedIds = channel.allowedRoleIds?.length
          ? channel.allowedRoleIds
          : policy?.allowedRoleIds ?? ["OWNER", "ADMIN"];
        const canViewByPreview =
          previewAsRoleId !== "GUEST" &&
          (allowedIds.includes(previewAsRoleId) ||
            Boolean(previewRole?.permissions.access_private_channels));
        if (!canViewByPreview) continue;
      }
      const key = channel.categoryId ?? "";
      const list = map.get(key);
      if (list) list.push(channel);
      else map.set(key, [channel]);
    }
    return map;
  }, [serverDetail, config.channelPolicies, previewAsRoleId, previewRole]);

  return (
    <aside
      aria-label="Danh sách kênh"
      className="w-60 bg-[#18181B] border-r border-[#2B2D30] flex flex-col flex-shrink-0 h-full select-none"
      data-testid="channel-sidebar"
    >
      <ServerHeader
        serverName={serverDetail?.name ?? serverSummary?.name ?? "Máy chủ"}
        badgeColor={config.badgeColor}
        isMe={false}
        isOpen={isServerMenuOpen}
        canInvite={canInvite}
        canManageServer={canManageServer}
        canManageChannels={canManageChannels}
        onToggle={() => setIsServerMenuOpen((prev) => !prev)}
        onClose={() => setIsServerMenuOpen(false)}
        onInvite={canInvite ? () => void createInvite() : undefined}
        onSettings={canManageServer ? () => openWorkspaceModal(serverId, "overview") : undefined}
        onRoles={canManageRoles ? () => openWorkspaceModal(serverId, "roles") : undefined}
        onMembers={canManageMembers ? () => openWorkspaceModal(serverId, "members") : undefined}
        onCreateChannel={
          canManageChannels
            ? () => {
                setCategoryId(undefined);
                setDialogMode("channel");
                setActionError("");
              }
            : undefined
        }
        onLeave={() => {
          setDialogMode("leave");
          setActionError("");
        }}
      />

      {/* Thanh thao tác nhanh chỉ hiển thị với thành viên có quyền Quản lý kênh hoặc Phân quyền */}
      {(canManageChannels || canManageRoles) && (
        <div className="px-2.5 py-2 border-b border-[#2B2D30] bg-[#141417]/60 flex items-center gap-1.5">
          {canManageChannels && (
            <button
              type="button"
              onClick={() => openWorkspaceModal(serverId, "channels")}
              data-testid="sidebar-new-channel-btn"
              className="flex-1 h-7 px-2 rounded-[4px] bg-[#1E1F22] hover:bg-[#2B2D30] border border-[#2B2D30] hover:border-[#393B40] text-[11px] font-medium text-[#E6EDF3] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span className="text-[#07C3F2] font-mono font-bold">+</span>
              <span className="truncate">Kênh & Khóa</span>
            </button>
          )}
          {canManageRoles && (
            <button
              type="button"
              onClick={() => openWorkspaceModal(serverId, "roles")}
              data-testid="sidebar-rbac-btn"
              className="flex-1 h-7 px-2 rounded-[4px] bg-[#1E1F22] hover:bg-[#2B2D30] border border-[#2B2D30] hover:border-[#393B40] text-[11px] font-medium text-[#E6EDF3] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-[#21D789] shrink-0" />
              <span className="truncate">Phân quyền</span>
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-16 px-2 custom-scrollbar space-y-4">
        {serverDetail ? (
          serverDetail.categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              channels={channelsByCategory.get(category.id) ?? []}
              serverId={serverId}
              currentChannelId={currentChannelId}
              onCreateChannel={
                canManageChannels
                  ? () => {
                      setCategoryId(category.id);
                      setDialogMode("channel");
                      setActionError("");
                    }
                  : undefined
              }
            />
          ))
        ) : (
          <div className="space-y-2 px-1 pt-1" aria-hidden="true">
            <div className="h-3 w-20 rounded bg-[#2B2D30]/60" />
            <div className="h-7 w-full rounded-[4px] bg-[#24262B]/60" />
            <div className="h-7 w-full rounded-[4px] bg-[#24262B]/40" />
            <div className="h-7 w-full rounded-[4px] bg-[#24262B]/30" />
          </div>
        )}
      </div>

      {dialogMode === "invite" ? (
        <DialogFrame
          title="Mời mọi người"
          description="Mã mời có hiệu lực trong 7 ngày."
          onClose={() => setDialogMode(null)}
        >
          {busy ? (
            <p role="status" className="text-sm text-[#A8A8B0]">
              Đang tạo mã mời…
            </p>
          ) : null}
          {inviteUrl ? (
            <div className="space-y-4">
              <label
                htmlFor="server-invite-url"
                className="block text-sm font-medium"
              >
                Liên kết mời
              </label>
              <input
                id="server-invite-url"
                readOnly
                value={inviteUrl}
                className="input-ocean w-full"
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(inviteUrl)
                    .then(() => setInviteCopied(true))
                    .catch(() =>
                      setActionError(
                        "Không thể truy cập clipboard. Hãy chọn và sao chép liên kết."
                      )
                    )
                }
              >
                {inviteCopied ? "Đã sao chép" : "Sao chép liên kết"}
              </button>
            </div>
          ) : null}
          {actionError ? (
            <p role="alert" className="text-sm text-rose-300">
              {actionError}
            </p>
          ) : null}
        </DialogFrame>
      ) : null}

      {dialogMode === "channel" ? (
        <DialogFrame
          title="Tạo kênh"
          description={
            categoryId
              ? "Kênh mới sẽ nằm trong danh mục bạn đã chọn."
              : "Kênh mới sẽ nằm trong danh mục đầu tiên của server."
          }
          onClose={() => setDialogMode(null)}
        >
          <form
            onSubmit={(event) => void createChannel(event)}
            className="space-y-4"
          >
            <label
              htmlFor="new-channel-name"
              className="block text-sm font-medium"
            >
              Tên kênh
            </label>
            <input
              id="new-channel-name"
              autoFocus
              required
              minLength={1}
              maxLength={100}
              pattern="[a-zA-Z0-9_-]+"
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
              className="input-ocean w-full"
            />
            {actionError ? (
              <p role="alert" className="text-sm text-rose-300">
                {actionError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDialogMode(null)}
              >
                Hủy
              </button>
              <button
                disabled={busy}
                className="btn-primary disabled:opacity-60"
              >
                {busy ? "Đang tạo…" : "Tạo kênh"}
              </button>
            </div>
          </form>
        </DialogFrame>
      ) : null}

      {dialogMode === "settings" ? (
        <DialogFrame
          title="Cài đặt máy chủ"
          description="Đổi tên hiển thị của server. ID server và danh tính chủ sở hữu không thay đổi."
          onClose={() => setDialogMode(null)}
        >
          <form
            onSubmit={(event) => void saveServerSettings(event)}
            className="space-y-4"
          >
            <label
              htmlFor="server-settings-name"
              className="block text-sm font-medium"
            >
              Tên máy chủ
            </label>
            <input
              id="server-settings-name"
              autoFocus
              required
              minLength={2}
              maxLength={100}
              value={serverName}
              onChange={(event) => setServerName(event.target.value)}
              className="input-ocean w-full"
            />
            {actionError ? (
              <p role="alert" className="text-sm text-rose-300">
                {actionError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDialogMode(null)}
              >
                Hủy
              </button>
              <button
                disabled={busy}
                className="btn-primary disabled:opacity-60"
              >
                {busy ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </DialogFrame>
      ) : null}

      {dialogMode === "leave" ? (
        <DialogFrame
          title="Rời máy chủ?"
          description={`Bạn sẽ không còn nhận được tin nhắn trong ${
            serverDetail?.name ?? "máy chủ này"
          }. Có thể tham gia lại bằng mã mời.`}
          onClose={() => setDialogMode(null)}
        >
          {actionError ? (
            <p role="alert" className="mb-4 text-sm text-rose-300">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDialogMode(null)}
            >
              Ở lại
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded border border-rose-500/50 bg-rose-500/15 px-4 py-2 text-sm text-rose-200 disabled:opacity-60"
              onClick={() => void leaveServer()}
            >
              {busy ? "Đang rời…" : "Rời máy chủ"}
            </button>
          </div>
        </DialogFrame>
      ) : null}
    </aside>
  );
}
