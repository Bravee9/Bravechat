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
import { ServerHeader } from "./ServerHeader";
import { CategorySection } from "./CategorySection";
import { DirectMessageItem } from "./DirectMessageItem";
import { UserProfileBar } from "./UserProfileBar";
import { cn } from "@/lib/utils";

export function ChannelSidebar() {
  const params = useParams();
  const pathname = usePathname();

  const rawServerId = (params?.serverId as string) || pathname.split("/")[2] || "@me";
  const serverId = decodeURIComponent(rawServerId);
  const isMe = serverId === "@me";

  const pathParts = pathname.split("/");
  const currentChannelId = (params?.channelId as string) || (pathParts.length >= 4 ? pathParts[3] : "general");

  const [serverDetail, setServerDetail] = useState<ServerDetail | null>(null);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);

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
      data-testid="channel-sidebar"
    >
      {/* 1. Header: Server Dropdown hoặc Tiêu đề DMs */}
      <ServerHeader
        serverName={serverDetail?.name || "Đang tải server..."}
        isMe={isMe}
        isOpen={isServerMenuOpen}
        onToggle={() => setIsServerMenuOpen((prev) => !prev)}
        onClose={() => setIsServerMenuOpen(false)}
      />

      {/* 2. Main Content: Danh sách Kênh hoặc Danh sách DMs */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar space-y-4">
        {isMe ? (
          /* TRƯỜNG HỢP 1: Trang chủ (@me) - Bạn bè & DMs */
          <>
            <Link
              href="/channels/@me"
              data-testid="friends-tab-btn"
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

              {conversations.map((dm) => (
                <DirectMessageItem
                  key={dm.id}
                  conversation={dm}
                  isActive={currentChannelId === dm.id}
                />
              ))}
            </div>
          </>
        ) : (
          /* TRƯỜNG HỢP 2: Kênh Server chia theo Category */
          <>
            {serverDetail?.categories.map((category) => {
              const categoryChannels = serverDetail.channels.filter(
                (c) => c.categoryId === category.id
              );

              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  channels={categoryChannels}
                  serverId={serverId}
                  currentChannelId={currentChannelId}
                />
              );
            })}
          </>
        )}
      </div>

      {/* 3. User Profile Bar dưới cùng */}
      <UserProfileBar currentUser={currentUser} />
    </aside>
  );
}
