"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DialogFrame } from "@/components/ui/DialogFrame";
import { http } from "@/services/http";
import { useCurrentUser } from "@/stores/workspace.store";
import type { UserSummary } from "@discord-clone/shared";
export function UserCard({ userId, onClose }: { userId: string; onClose: () => void }) {
  const current = useCurrentUser();
  const [user, setUser] = useState<(UserSummary & { bio?: string | null; customStatus?: string | null }) | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; void http.get<{ user: UserSummary }>("/users/" + encodeURIComponent(userId)).then((result) => { if (active) setUser(result.user); }).catch((reason) => { if (active) setError(reason.message); }); return () => { active = false; }; }, [userId]);
  const act = async (block: boolean) => {
    if (!user) return;
    setBusy(true); setError("");
    try { await http.post(block ? "/users/@me/friends/block" : "/users/@me/friends", block ? { userId } : { username: user.username }); setNotice(block ? "Đã chặn người dùng." : "Đã gửi lời mời kết bạn."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể thực hiện thao tác."); }
    finally { setBusy(false); }
  };
  return <DialogFrame title="Hồ sơ người dùng" onClose={onClose}>
    {user ? <div className="space-y-3"><h3 className="font-bold text-lg">{user.displayName || user.username}</h3><p className="text-sm text-ocean-light/60">@{user.username}</p>{user.bio && <p className="whitespace-pre-wrap text-sm">{user.bio}</p>}{user.customStatus && <p className="text-xs text-ocean-light/60">{user.customStatus}</p>}{user.id !== current?.id && <div className="flex flex-wrap gap-2"><Link className="btn-primary" href={"/channels/@me/" + encodeURIComponent(user.id)} onClick={onClose}>Nhắn tin</Link><button className="btn-secondary" disabled={busy} onClick={() => void act(false)}>Kết bạn</button><button className="btn-secondary" disabled={busy} onClick={() => void act(true)}>Chặn</button></div>}</div> : !error && <p role="status">Đang tải...</p>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}{notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
    <button className="btn-secondary mt-5" onClick={onClose}>Đóng</button>
  </DialogFrame>;
}
