"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { http } from "@/services/http";
import { SearchIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import type { FriendLists, FriendshipEntry } from "@discord-clone/shared";

type Entry = FriendshipEntry;
type Lists = FriendLists;

export function FriendsPanel() {
  const [lists, setLists] = useState<Lists>({
    friends: [],
    incoming: [],
    outgoing: [],
    blocked: [],
  });
  const [tab, setTab] = useState<"friends" | "online" | "pending" | "blocked">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setLists(await http.get<Lists>("/users/@me/friends"));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể tải bạn bè."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    const listener = (event: Event) => {
      if ((event as CustomEvent).detail?.type === "friends_update") void load();
    };
    const syncListener = () => void load();
    window.addEventListener("bravechat:realtime", listener);
    window.addEventListener("bravechat:friends-sync", syncListener);
    return () => {
      clearInterval(timer);
      window.removeEventListener("bravechat:realtime", listener);
      window.removeEventListener("bravechat:friends-sync", syncListener);
    };
  }, [load]);

  const act = async (work: () => Promise<unknown>, success = "") => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      await load();
      setNotice(success);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể thực hiện thao tác."
      );
    } finally {
      setBusy(false);
    }
  };

  const matchesSearch = (entry: Entry) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const display = (entry.user.displayName || entry.user.username).toLowerCase();
    return display.includes(q) || entry.user.username.toLowerCase().includes(q);
  };

  const onlineFriends = lists.friends.filter(
    (entry) => entry.user.status && !["OFFLINE", "INVISIBLE"].includes(entry.user.status)
  );

  const row = (entry: Entry, group: keyof Lists) => {
    const status = entry.user.status ?? "OFFLINE";
    const statusLabel =
      status === "ONLINE"
        ? "Trực tuyến"
        : status === "IDLE"
        ? "Chờ"
        : status === "DO_NOT_DISTURB"
        ? "Không làm phiền"
        : "Ngoại tuyến";

    return (
      <li
        key={entry.id}
        className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2B2D30]/70 px-3 py-3 hover:bg-[#24262B]/60 rounded-[4px] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#2B2D30] border border-[#393B40] flex items-center justify-center text-xs font-bold text-[#DFE1E5] overflow-hidden">
              {entry.user.avatarUrl ? (
                <img
                  src={entry.user.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                (
                  entry.user.displayName?.[0] ||
                  entry.user.username[0] ||
                  "U"
                ).toUpperCase()
              )}
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1E1F22]",
                status === "ONLINE" && "bg-emerald-500",
                status === "IDLE" && "bg-amber-500",
                status === "DO_NOT_DISTURB" && "bg-rose-500",
                (status === "OFFLINE" || status === "INVISIBLE") && "bg-slate-500"
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-[#F2F2F3] truncate">
                {entry.user.displayName || entry.user.username}
              </p>
              <span className="text-xs text-[#7D7D7D] font-mono truncate">
                @{entry.user.username}
              </span>
            </div>
            <p className="text-[11px] text-[#8C8E94]">{statusLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {group === "friends" && (
            <>
              <Link
                className="ide-btn-primary"
                href={`/channels/@me/${encodeURIComponent(entry.user.id)}`}
              >
                Nhắn tin
              </Link>
              <button
                type="button"
                disabled={busy}
                className="ide-btn-secondary"
                onClick={() =>
                  void act(() =>
                    http.delete("/users/@me/friends/" + entry.id)
                  )
                }
              >
                Hủy kết bạn
              </button>
              <button
                type="button"
                disabled={busy}
                className="ide-btn-secondary"
                onClick={() =>
                  void act(() =>
                    http.post("/users/@me/friends/block", {
                      userId: entry.user.id,
                    })
                  )
                }
              >
                Chặn
              </button>
            </>
          )}
          {group === "incoming" && (
            <>
              <button
                type="button"
                disabled={busy}
                className="ide-btn-primary"
                onClick={() =>
                  void act(
                    () =>
                      http.put("/users/@me/friends/" + entry.id, {
                        action: "accept",
                      }),
                    "Đã chấp nhận lời mời."
                  )
                }
              >
                Chấp nhận
              </button>
              <button
                type="button"
                disabled={busy}
                className="ide-btn-secondary"
                onClick={() =>
                  void act(() =>
                    http.put("/users/@me/friends/" + entry.id, {
                      action: "reject",
                    })
                  )
                }
              >
                Từ chối
              </button>
            </>
          )}
          {(group === "outgoing" || group === "blocked") && (
            <button
              type="button"
              disabled={busy}
              className="ide-btn-secondary"
              onClick={() =>
                void act(() => http.delete("/users/@me/friends/" + entry.id))
              }
            >
              {group === "blocked" ? "Bỏ chặn" : "Hủy lời mời"}
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <main
      className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#1E1F22] text-[#DFE1E5]"
      data-testid="friends-panel"
    >
      {/* Top Toolbar (Reference Image 2) */}
      <header className="friends-toolbar flex h-[44px] flex-wrap items-center gap-3 border-b border-[#2B2D30] bg-[#1E1F22] px-4 flex-shrink-0">
        <h1 className="flex items-center gap-2 border-r border-[#2B2D30] pr-4 text-sm font-semibold text-white">
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-[#07C3F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 11a4 4 0 100-8 4 4 0 000 8zm8-1a3 3 0 100-6 3 3 0 000 6zM1 20v-2c0-3 4-5 7-5s7 2 7 5v2H1zm16 0v-2c0-1.9-.8-3.5-2.2-4.6C18.2 12.5 23 14.7 23 18v2h-6z" />
          </svg>
          <span>Bạn bè</span>
        </h1>
        <nav aria-label="Bộ lọc bạn bè" className="flex flex-wrap items-center gap-1.5">
          {(["online", "friends", "pending", "blocked"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={cn(
                "rounded-[4px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                tab === key
                  ? "bg-[#2E436E] text-white font-semibold"
                  : "text-[#A8A8B0] hover:bg-[#2B2D30]/60 hover:text-white"
              )}
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {key === "online"
                ? `Trực tuyến (${onlineFriends.length})`
                : key === "friends"
                ? `Tất cả (${lists.friends.length})`
                : key === "pending"
                ? `Đang chờ (${lists.incoming.length + lists.outgoing.length})`
                : `Đã chặn (${lists.blocked.length})`}
            </button>
          ))}
        </nav>
      </header>

      <section className="flex-1 overflow-auto p-6 space-y-5 custom-scrollbar">
        {/* Add Friend Bar */}
        <div className="p-4 rounded-[6px] bg-[#18181B] border border-[#2B2D30]">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-white">
            Thêm bạn bè
          </h2>
          <p className="mb-3 text-xs text-[#8C8E94]">
            Bạn có thể thêm bạn bè bằng tên người dùng (username) của họ.
          </p>
          <form
            className="flex flex-wrap gap-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              void act(async () => {
                await http.post("/users/@me/friends", { username });
                setUsername("");
                setTab("pending");
              }, "Đã gửi lời mời kết bạn.");
            }}
          >
            <label className="flex-1 min-w-[180px]">
              <span className="sr-only">Tên người dùng</span>
              <input
                className="w-full h-8 px-3 rounded-[4px] bg-[#141417] border border-[#393B40] focus:border-[#3574F0] focus:outline-none text-xs text-white placeholder:text-[#6F737A]"
                placeholder="Nhập username để kết bạn"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
                maxLength={32}
              />
            </label>
            <button
              disabled={busy || username.trim().length < 3}
              className="ide-btn-primary h-8"
            >
              Thêm bạn
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-2.5 text-xs text-rose-300">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mt-2.5 text-xs text-emerald-300">
              {notice}
            </p>
          )}
        </div>

        {/* Search Filter Bar (Reference Image 2) */}
        <div className="relative flex items-center">
          <SearchIcon className="w-3.5 h-3.5 text-[#6F737A] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trong danh sách..."
            aria-label="Tìm kiếm bạn bè"
            className="w-full h-8 pl-8 pr-3 rounded-[4px] bg-[#141417] border border-[#2B2D30] focus:border-[#3574F0] focus:outline-none text-xs text-[#DFE1E5] placeholder:text-[#6F737A]"
          />
        </div>

        {/* Friends Lists */}
        {loading ? (
          <p role="status" className="text-xs text-[#8C8E94]">
            Đang tải...
          </p>
        ) : tab === "pending" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8C8E94] mb-2">
                Lời mời nhận được — {lists.incoming.filter(matchesSearch).length}
              </h2>
              <ul>{lists.incoming.filter(matchesSearch).map((entry) => row(entry, "incoming"))}</ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8C8E94] mb-2">
                Lời mời đã gửi — {lists.outgoing.filter(matchesSearch).length}
              </h2>
              <ul>{lists.outgoing.filter(matchesSearch).map((entry) => row(entry, "outgoing"))}</ul>
            </div>
            {!lists.incoming.length && !lists.outgoing.length && (
              <p className="my-4 text-xs text-[#8C8E94]">
                Không có lời mời đang chờ.
              </p>
            )}
          </div>
        ) : tab === "online" ? (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8C8E94] mb-2">
              Trực tuyến — {onlineFriends.filter(matchesSearch).length}
            </h2>
            <ul>{onlineFriends.filter(matchesSearch).map((entry) => row(entry, "friends"))}</ul>
            {!onlineFriends.length && (
              <p className="text-xs text-[#8C8E94]">
                Hiện chưa có người bạn nào đang trực tuyến.
              </p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8C8E94] mb-2">
              {tab === "friends"
                ? `Tất cả bạn bè — ${lists.friends.filter(matchesSearch).length}`
                : `Đã chặn — ${lists.blocked.filter(matchesSearch).length}`}
            </h2>
            <ul>{lists[tab].filter(matchesSearch).map((entry) => row(entry, tab))}</ul>
            {!lists[tab].length && (
              <p className="text-xs text-[#8C8E94]">
                {tab === "friends"
                  ? "Chưa có bạn bè. Nhập username để gửi lời mời."
                  : "Bạn chưa chặn người dùng nào."}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
