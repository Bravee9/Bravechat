"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { http } from "@/services/http";
import type { FriendLists, FriendshipEntry } from "@discord-clone/shared";

type Entry = FriendshipEntry;
type Lists = FriendLists;
export function FriendsPanel() {
  const [lists, setLists] = useState<Lists>({ friends: [], incoming: [], outgoing: [], blocked: [] });
  const [tab, setTab] = useState<"friends" | "pending" | "blocked">("friends");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try { setLists(await http.get<Lists>("/users/@me/friends")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải bạn bè."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    const listener = (event: Event) => { if ((event as CustomEvent).detail.type === "friends_update") void load(); };
    window.addEventListener("bravechat:realtime", listener);
    return () => { clearInterval(timer); window.removeEventListener("bravechat:realtime", listener); };
  }, [load]);
  const act = async (work: () => Promise<unknown>, success = "") => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await work(); await load(); setNotice(success); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể thực hiện thao tác."); }
    finally { setBusy(false); }
  };
  const row = (entry: Entry, group: keyof Lists) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ocean-dark-border px-3 py-4">
    <div><p className="font-semibold">{entry.user.displayName || entry.user.username}</p><p className="text-xs text-ocean-light/60">@{entry.user.username}</p></div>
    <div className="flex gap-2 text-xs">
      {group === "friends" && <><Link className="btn-secondary" href={`/channels/@me/${encodeURIComponent(entry.user.id)}`}>Nhắn tin</Link><button disabled={busy} className="btn-secondary" onClick={() => void act(() => http.delete("/users/@me/friends/" + entry.id))}>Hủy kết bạn</button><button disabled={busy} className="btn-secondary" onClick={() => void act(() => http.post("/users/@me/friends/block", { userId: entry.user.id }))}>Chặn</button></>}
      {group === "incoming" && <><button disabled={busy} className="btn-primary" onClick={() => void act(() => http.put("/users/@me/friends/" + entry.id, { action: "accept" }), "Đã chấp nhận lời mời.")}>Chấp nhận</button><button disabled={busy} className="btn-secondary" onClick={() => void act(() => http.put("/users/@me/friends/" + entry.id, { action: "reject" }))}>Từ chối</button></>}
      {(group === "outgoing" || group === "blocked") && <button disabled={busy} className="btn-secondary" onClick={() => void act(() => http.delete("/users/@me/friends/" + entry.id))}>{group === "blocked" ? "Bỏ chặn" : "Hủy lời mời"}</button>}
    </div>
  </li>;
  return <main className="flex-1 min-w-0 overflow-auto bg-ocean-dark-bg p-6 text-ocean-light" data-testid="friends-panel">
    <h1 className="text-xl font-bold">Bạn bè</h1>
    <nav aria-label="Bộ lọc bạn bè" className="my-5 flex flex-wrap gap-2">{(["friends", "pending", "blocked"] as const).map((key) => <button key={key} className={tab === key ? "btn-primary" : "btn-secondary"} aria-pressed={tab === key} onClick={() => setTab(key)}>{key === "friends" ? `Tất cả (${lists.friends.length})` : key === "pending" ? `Đang chờ (${lists.incoming.length + lists.outgoing.length})` : `Đã chặn (${lists.blocked.length})`}</button>)}</nav>
    <form className="mb-5 flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); void act(async () => { await http.post("/users/@me/friends", { username }); setUsername(""); setTab("pending"); }, "Đã gửi lời mời kết bạn."); }}>
      <label className="flex-1 min-w-[180px]"><span className="sr-only">Tên người dùng</span><input className="input-ocean w-full" placeholder="Nhập username để kết bạn" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} maxLength={32} /></label>
      <button disabled={busy || username.trim().length < 3} className="btn-primary">Thêm bạn</button>
    </form>
    {error && <p role="alert" className="my-3 text-sm text-rose-300">{error}</p>}
    {notice && <p role="status" className="my-3 text-sm text-emerald-300">{notice}</p>}
    {loading ? <p role="status">Đang tải...</p> : tab === "pending" ? <><h2 className="text-sm text-ocean-light/60">Lời mời nhận được</h2><ul>{lists.incoming.map((entry) => row(entry, "incoming"))}</ul><h2 className="mt-5 text-sm text-ocean-light/60">Lời mời đã gửi</h2><ul>{lists.outgoing.map((entry) => row(entry, "outgoing"))}</ul>{!lists.incoming.length && !lists.outgoing.length && <p className="my-4 text-sm text-ocean-light/60">Không có lời mời đang chờ.</p>}</> : <><ul>{lists[tab].map((entry) => row(entry, tab))}</ul>{!lists[tab].length && <p className="text-sm text-ocean-light/60">{tab === "friends" ? "Chưa có bạn bè. Nhập username để gửi lời mời." : "Bạn chưa chặn người dùng nào."}</p>}</>}
  </main>;
}
