"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type {
  CurrentUser,
  DirectConversation,
  ServerDetail,
} from "@discord-clone/shared";
import { serverService } from "@/services/server.service";
import { channelService } from "@/services/channel.service";
import { userService } from "@/services/user.service";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export function ChannelSidebar() {
  const params = useParams();
  const pathname = usePathname();

  const rawServerId = (params?.serverId as string) || pathname.split("/")[2] || "@me";
  const serverId = decodeURIComponent(rawServerId);
  const isMe = serverId === "@me";

  // Channel ID hiện tại (ví dụ: general, announcements, hoặc dmId)
  const pathParts = pathname.split("/");
  const currentChannelId = (params?.channelId as string) || (pathParts.length >= 4 ? pathParts[3] : "general");

  const [serverDetail, setServerDetail] = useState<ServerDetail | null>(null);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Tải dữ liệu server hoặc DMs
  useEffect(() => {
    let isMounted = true;

    userService.getCurrentUser().then((u) => {
      if (isMounted) setCurrentUser(u);
    });

    if (isMe) {
      channelService.getDirectConversations().then((dms) => {
        if (isMounted) setConversations(dms);
      });
    } else {
      serverService.getServerDetail(serverId).then((detail) => {
        if (isMounted) setServerDetail(detail);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [serverId, isMe]);

  return (
    <aside
      aria-label={isMe ? "Danh sách tin nhắn trực tiếp" : "Danh sách kênh"}
      className="w-60 bg-ocean-dark-surface border-r border-ocean-dark-border flex flex-col flex-shrink-0 h-full select-none"
    >
      {/* ─── Header: Tên server hoặc Tên hộp thư DMs ─── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !isMe && setIsServerMenuOpen((prev) => !prev)}
          className={cn(
            "h-14 w-full border-b border-ocean-dark-border px-4 flex items-center justify-between transition-colors z-20",
            !isMe ? "hover:bg-white/5 cursor-pointer" : "cursor-default"
          )}
        >
          <span className="text-ocean-light text-sm font-bold truncate">
            {isMe ? "Tin nhắn trực tiếp" : serverDetail?.name || "Đang tải server..."}
          </span>
          {!isMe && (
            <svg
              className={cn(
                "w-4 h-4 text-ocean-light/70 transition-transform duration-200",
                isServerMenuOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Server Dropdown Menu */}
        {isServerMenuOpen && !isMe && (
          <div className="absolute top-[58px] left-2 right-2 bg-[#061829] border border-ocean-dark-border rounded-lg shadow-2xl p-1.5 z-40 animate-fade-in text-xs font-semibold">
            <button
              onClick={() => setIsServerMenuOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 text-ocean-secondary hover:bg-ocean-primary hover:text-white rounded transition-colors"
            >
              <span>Mời mọi người</span>
              <span>+</span>
            </button>
            <button
              onClick={() => setIsServerMenuOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 text-ocean-light/80 hover:bg-white/5 rounded transition-colors"
            >
              <span>Cài đặt máy chủ</span>
              <span>⚙️</span>
            </button>
            <button
              onClick={() => setIsServerMenuOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 text-ocean-light/80 hover:bg-white/5 rounded transition-colors"
            >
              <span>Tạo kênh</span>
              <span>#</span>
            </button>
            <div className="h-px bg-ocean-dark-border my-1" />
            <button
              onClick={() => setIsServerMenuOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-2 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-colors"
            >
              <span>Rời khỏi máy chủ</span>
              <span>🚪</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Main Content: Channel / DMs List (Scrollable) ─── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar space-y-4">
        {isMe ? (
          /* TRƯỜNG HỢP 1: Trang chủ (@me) - Bạn bè & DMs */
          <>
            {/* Mục Friends cố định ở đầu */}
            <Link
              href="/channels/@me"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded transition-colors cursor-pointer group text-sm font-semibold",
                currentChannelId === "friends" || pathname === "/channels/@me"
                  ? "bg-ocean-primary/20 text-ocean-light border border-ocean-primary/30"
                  : "text-ocean-light/70 hover:bg-white/5 hover:text-ocean-light"
              )}
            >
              <svg className="w-5 h-5 text-ocean-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span>Bạn bè</span>
            </Link>

            <div className="pt-2">
              <div className="flex items-center justify-between px-2 mb-1.5 text-ocean-light/50 text-[11px] font-bold uppercase tracking-wider">
                <span>Tin nhắn trực tiếp</span>
                <span className="text-sm cursor-pointer hover:text-ocean-light" title="Bắt đầu cuộc trò chuyện mới">+</span>
              </div>

              {conversations.map((dm) => {
                const isActive = currentChannelId === dm.id;
                return (
                  <Link
                    key={dm.id}
                    href={`/channels/@me/${dm.id}`}
                    className={cn(
                      "flex items-center gap-3 px-2.5 py-2 rounded transition-colors group cursor-pointer relative",
                      isActive
                        ? "bg-ocean-primary/20 text-ocean-light border border-ocean-primary/30"
                        : "text-ocean-light/75 hover:bg-white/5 hover:text-ocean-light"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-ocean-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {dm.recipient.displayName?.[0] || dm.recipient.username[0]?.toUpperCase()}
                      </div>
                      {/* Trạng thái online */}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-ocean-dark-surface",
                          dm.recipient.status === "ONLINE" && "bg-emerald-500",
                          dm.recipient.status === "IDLE" && "bg-amber-500",
                          dm.recipient.status === "DO_NOT_DISTURB" && "bg-rose-500",
                          dm.recipient.status === "OFFLINE" && "bg-slate-500"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {dm.recipient.displayName || dm.recipient.username}
                      </p>
                      <p className="text-[11px] text-ocean-light/40 truncate">
                        {dm.recipient.status.toLowerCase()}
                      </p>
                    </div>
                    {dm.hasUnread && (
                      <span className="w-2 h-2 rounded-full bg-ocean-secondary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          /* TRƯỜNG HỢP 2: Kênh Server thường */
          <>
            {serverDetail?.categories.map((category) => {
              const categoryChannels = serverDetail.channels.filter(
                (c) => c.categoryId === category.id
              );

              return (
                <div key={category.id} className="space-y-0.5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-2 py-1 text-ocean-light/50 text-[11px] font-extrabold uppercase tracking-wider group">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-ocean-light/80">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>{category.name}</span>
                    </div>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                      title="Tạo kênh mới trong danh mục này"
                    >
                      +
                    </button>
                  </div>

                  {/* Channel Items */}
                  {categoryChannels.map((channel) => {
                    const isActive = currentChannelId === channel.id;
                    const isVoice = channel.type === "VOICE";

                    return (
                      <Link
                        key={channel.id}
                        href={`/channels/${serverId}/${channel.id}`}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-1.5 rounded transition-colors group cursor-pointer text-sm font-medium",
                          isActive
                            ? "bg-ocean-primary/25 text-white font-semibold border-l-2 border-ocean-secondary"
                            : "text-ocean-light/70 hover:bg-white/5 hover:text-ocean-light"
                        )}
                      >
                        {isVoice ? (
                          <svg className="w-4 h-4 text-ocean-light/50 group-hover:text-ocean-light/80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        ) : (
                          <span className="text-ocean-light/50 font-mono text-base leading-none">#</span>
                        )}

                        <span className="flex-1 truncate">{channel.name}</span>

                        {channel.mentionCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {channel.mentionCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ─── Bottom: User Profile Bar (Discord Standard) ─── */}
      <footer className="h-14 bg-[#051424] border-t border-ocean-dark-border px-3 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-ocean-primary flex items-center justify-center text-white text-xs font-bold shadow-ocean-glow">
              {currentUser?.displayName?.[0] || "B"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#051424] bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-ocean-light text-xs font-bold truncate leading-tight">
              {currentUser?.displayName || "Bravee9"}
            </p>
            <p className="text-ocean-light/40 text-[10px] truncate font-mono">
              #{currentUser?.discriminator || "0001"}
            </p>
          </div>
        </div>

        {/* Quick action buttons: Mute Mic, Deafen, Settings */}
        <div className="flex items-center gap-0.5 text-ocean-light/60">
          <Tooltip content={isMicMuted ? "Bật Mic" : "Tắt Mic"} side="top">
            <button
              type="button"
              onClick={() => setIsMicMuted((prev) => !prev)}
              className={cn(
                "p-1.5 rounded hover:bg-white/10 hover:text-ocean-light transition-colors cursor-pointer",
                isMicMuted && "text-rose-400 hover:text-rose-300"
              )}
              aria-label="Điều khiển Mic"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
              </svg>
            </button>
          </Tooltip>

          <Tooltip content={isDeafened ? "Bật Âm Thanh" : "Tắt Âm Thanh"} side="top">
            <button
              type="button"
              onClick={() => setIsDeafened((prev) => !prev)}
              className={cn(
                "p-1.5 rounded hover:bg-white/10 hover:text-ocean-light transition-colors cursor-pointer",
                isDeafened && "text-rose-400 hover:text-rose-300"
              )}
              aria-label="Điều khiển Tai nghe"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </Tooltip>

          <Tooltip content="Cài đặt người dùng" side="top">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-white/10 hover:text-ocean-light transition-colors cursor-pointer"
              aria-label="Cài đặt người dùng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </footer>
    </aside>
  );
}
