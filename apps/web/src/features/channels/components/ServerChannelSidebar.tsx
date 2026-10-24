"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadServerDetail, loadServers, useServerDetail } from "@/stores/workspace.store";
import { ServerHeader } from "./ServerHeader";
import { CategorySection } from "./CategorySection";
import { DialogFrame } from "@/components/ui/DialogFrame";
import { API_ROUTES } from "@discord-clone/shared";
import { http } from "@/services/http";

/**
 * LAYER 2 (nhánh server) — Danh sách kênh theo category.
 * Đọc từ store (stale-while-revalidate): quay lại server đã xem thì hiển thị ngay,
 * không nhấp nháy "Đang tải".
 */
export function ServerChannelSidebar({ serverId }: { serverId: string }) {
  const params = useParams();
  const currentChannelId = (params?.channelId as string) || "general";

  const serverDetail = useServerDetail(serverId);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"invite" | "channel" | "leave" | "settings" | null>(null);
  const [channelName, setChannelName] = useState("");
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
      await http.patch(API_ROUTES.servers.detail(serverId), { name: serverName.trim() });
      await Promise.all([loadServerDetail(serverId, true), loadServers(true)]);
      setDialogMode(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể cập nhật máy chủ.");
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
      const { invite } = await http.post<{ invite: { code: string; expiresAt: string } }>(API_ROUTES.servers.createInvite(serverId));
      setInviteUrl(`${window.location.origin}/invite/${encodeURIComponent(invite.code)}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể tạo mã mời.");
    } finally {
      setBusy(false);
    }
  }

  async function createChannel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setBusy(true);
    try {
      const { channel } = await http.post<{ channel: { id: string } }>(API_ROUTES.servers.channels(serverId), { name: channelName.trim(), type: "TEXT" });
      await loadServerDetail(serverId, true);
      setDialogMode(null);
      setChannelName("");
      router.push(`/channels/${encodeURIComponent(serverId)}/${encodeURIComponent(channel.id)}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể tạo kênh.");
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
      setActionError(error instanceof Error ? error.message : "Không thể rời máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  // Nhóm kênh theo category một lần (O(n)) thay vì filter lặp cho từng category.
  const channelsByCategory = useMemo(() => {
    const map = new Map<string, NonNullable<typeof serverDetail>["channels"]>();
    for (const channel of serverDetail?.channels ?? []) {
      const key = channel.categoryId ?? "";
      const list = map.get(key);
      if (list) list.push(channel);
      else map.set(key, [channel]);
    }
    return map;
  }, [serverDetail]);

  return (
    <aside
      aria-label="Danh sách kênh"
      className="w-60 bg-ocean-dark-surface border-r border-ocean-dark-border flex flex-col flex-shrink-0 h-full select-none"
      data-testid="channel-sidebar"
    >
      <ServerHeader
        serverName={serverDetail?.name || "Đang tải server..."}
        isMe={false}
        isOpen={isServerMenuOpen}
        onToggle={() => setIsServerMenuOpen((prev) => !prev)}
        onClose={() => setIsServerMenuOpen(false)}
        onInvite={() => void createInvite()}
        onSettings={() => { setServerName(serverDetail?.name ?? ""); setDialogMode("settings"); setActionError(""); }}
        onCreateChannel={() => { setDialogMode("channel"); setActionError(""); }}
        onLeave={() => { setDialogMode("leave"); setActionError(""); }}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-16 px-2 custom-scrollbar space-y-4">
        {serverDetail?.categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            channels={channelsByCategory.get(category.id) ?? []}
            serverId={serverId}
            currentChannelId={currentChannelId}
            onCreateChannel={() => { setDialogMode("channel"); setActionError(""); }}
          />
        ))}
      </div>
      {dialogMode === "invite" ? (
        <DialogFrame title="Mời mọi người" description="Mã mời có hiệu lực trong 7 ngày." onClose={() => setDialogMode(null)}>
          {busy ? <p role="status" className="text-sm text-ocean-light/70">Đang tạo mã mời…</p> : null}
          {inviteUrl ? (
            <div className="space-y-4">
              <label htmlFor="server-invite-url" className="block text-sm font-medium">Liên kết mời</label>
              <input id="server-invite-url" readOnly value={inviteUrl} className="input-ocean w-full" onFocus={(event) => event.currentTarget.select()} />
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => void navigator.clipboard.writeText(inviteUrl)
                  .then(() => setInviteCopied(true))
                  .catch(() => setActionError("Không thể truy cập clipboard. Hãy chọn và sao chép liên kết."))}
              >
                {inviteCopied ? "Đã sao chép" : "Sao chép liên kết"}
              </button>
            </div>
          ) : null}
          {actionError ? <p role="alert" className="text-sm text-rose-300">{actionError}</p> : null}
        </DialogFrame>
      ) : null}
      {dialogMode === "channel" ? (
        <DialogFrame title="Tạo kênh" description="Kênh mới sẽ nằm trong danh mục đầu tiên của server." onClose={() => setDialogMode(null)}>
          <form onSubmit={(event) => void createChannel(event)} className="space-y-4">
            <label htmlFor="new-channel-name" className="block text-sm font-medium">Tên kênh</label>
            <input id="new-channel-name" autoFocus required minLength={1} maxLength={100} pattern="[a-zA-Z0-9_-]+" value={channelName} onChange={(event) => setChannelName(event.target.value)} className="input-ocean w-full" />
            {actionError ? <p role="alert" className="text-sm text-rose-300">{actionError}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setDialogMode(null)}>Hủy</button>
              <button disabled={busy} className="btn-primary disabled:opacity-60">{busy ? "Đang tạo…" : "Tạo kênh"}</button>
            </div>
          </form>
        </DialogFrame>
      ) : null}
      {dialogMode === "settings" ? (
        <DialogFrame title="Cài đặt máy chủ" description="Đổi tên hiển thị của server. ID server và danh tính chủ sở hữu không thay đổi." onClose={() => setDialogMode(null)}>
          <form onSubmit={(event) => void saveServerSettings(event)} className="space-y-4">
            <label htmlFor="server-settings-name" className="block text-sm font-medium">Tên máy chủ</label>
            <input id="server-settings-name" autoFocus required minLength={2} maxLength={100} value={serverName} onChange={(event) => setServerName(event.target.value)} className="input-ocean w-full" />
            {actionError ? <p role="alert" className="text-sm text-rose-300">{actionError}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setDialogMode(null)}>Hủy</button>
              <button disabled={busy} className="btn-primary disabled:opacity-60">{busy ? "Đang lưu…" : "Lưu thay đổi"}</button>
            </div>
          </form>
        </DialogFrame>
      ) : null}
      {dialogMode === "leave" ? (
        <DialogFrame title="Rời máy chủ?" description={`Bạn sẽ không còn nhận được tin nhắn trong ${serverDetail?.name ?? "máy chủ này"}. Có thể tham gia lại bằng mã mời.`} onClose={() => setDialogMode(null)}>
          {actionError ? <p role="alert" className="mb-4 text-sm text-rose-300">{actionError}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setDialogMode(null)}>Ở lại</button>
            <button type="button" disabled={busy} className="rounded border border-rose-500/50 bg-rose-500/15 px-4 py-2 text-sm text-rose-200 disabled:opacity-60" onClick={() => void leaveServer()}>{busy ? "Đang rời…" : "Rời máy chủ"}</button>
          </div>
        </DialogFrame>
      ) : null}
    </aside>
  );
}
