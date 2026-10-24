"use client";

import { useState } from "react";
import type { CurrentUser } from "@discord-clone/shared";
import { http } from "@/services/http";

export function ProfileSettingsModal({ user, onClose, onSaved }: { user: CurrentUser; onClose: () => void; onSaved: (user: CurrentUser) => void }) {
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [status, setStatus] = useState(user.status);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await http.patch<{ user: CurrentUser & { bio?: string | null } }>("/users/@me", { username, displayName: displayName || null, bio: bio || null, status });
      onSaved(result.user);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu hồ sơ.");
    } finally { setBusy(false); }
  }

  async function upload(field: "avatar" | "banner", file?: File) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file, file.name);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${field === "avatar" ? "users/@me/avatar" : "users/@me/banner"}`, { method: "POST", credentials: "include", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Không thể tải ảnh lên.");
      onSaved(body.data.user as CurrentUser);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải ảnh lên.");
    } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form onSubmit={save} className="w-full max-w-lg rounded-xl border border-ocean-dark-border bg-[#0b1c2d] p-6 shadow-2xl" aria-labelledby="profile-settings-title">
      <div className="mb-5 flex items-center justify-between"><h2 id="profile-settings-title" className="text-lg font-bold text-ocean-light">Hồ sơ người dùng</h2><button type="button" onClick={onClose} className="text-ocean-light/70 hover:text-white" aria-label="Đóng">✕</button></div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <label className="cursor-pointer rounded-lg border border-ocean-dark-border p-3 text-sm text-ocean-light hover:bg-white/5">Ảnh đại diện<input className="mt-2 block w-full text-xs" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" onChange={(event) => void upload("avatar", event.target.files?.[0])} /></label>
        <label className="cursor-pointer rounded-lg border border-ocean-dark-border p-3 text-sm text-ocean-light hover:bg-white/5">Ảnh nền hồ sơ<input className="mt-2 block w-full text-xs" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" onChange={(event) => void upload("banner", event.target.files?.[0])} /></label>
      </div>
      <label className="input-label" htmlFor="profile-username">Tên người dùng</label><input id="profile-username" required minLength={3} maxLength={32} pattern="[a-z0-9._]+" value={username} onChange={(event) => setUsername(event.target.value)} className="mb-4 w-full rounded border border-ocean-dark-border bg-black/20 px-3 py-2 text-ocean-light" />
      <label className="input-label" htmlFor="profile-display-name">Tên hiển thị</label><input id="profile-display-name" maxLength={32} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mb-4 w-full rounded border border-ocean-dark-border bg-black/20 px-3 py-2 text-ocean-light" />
      <label className="input-label" htmlFor="profile-email">Email (không thể thay đổi)</label><input id="profile-email" readOnly value={user.email} className="mb-4 w-full cursor-not-allowed rounded border border-ocean-dark-border bg-black/10 px-3 py-2 text-ocean-light/60" />
      <label className="input-label" htmlFor="profile-bio">Giới thiệu</label><textarea id="profile-bio" maxLength={190} value={bio} onChange={(event) => setBio(event.target.value)} className="mb-4 min-h-20 w-full rounded border border-ocean-dark-border bg-black/20 px-3 py-2 text-ocean-light" placeholder="Chia sẻ đôi điều về bạn" />
      <label className="input-label" htmlFor="profile-status">Trạng thái</label><select id="profile-status" value={status} onChange={(event) => setStatus(event.target.value as CurrentUser["status"])} className="mb-4 w-full rounded border border-ocean-dark-border bg-[#061829] px-3 py-2 text-ocean-light"><option value="ONLINE">Trực tuyến</option><option value="IDLE">Chờ</option><option value="DO_NOT_DISTURB">Không làm phiền</option><option value="INVISIBLE">Ẩn</option><option value="OFFLINE">Ngoại tuyến</option></select>
      {error ? <p role="alert" className="mb-3 text-sm text-rose-400">{error}</p> : null}
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm text-ocean-light/70">Hủy</button><button disabled={busy} className="rounded bg-ocean-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
    </form>
  </div>;
}
