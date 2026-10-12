"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ServerListItem } from "@discord-clone/shared";
import { serverService } from "@/services/server.service";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export function ServerRail() {
  const pathname = usePathname();
  const params = useParams();

  // serverId từ route params hoặc URL path
  const rawServerId = (params?.serverId as string) || pathname.split("/")[2] || "@me";
  const currentServerId = decodeURIComponent(rawServerId);
  const isHomeActive = currentServerId === "@me";

  const [servers, setServers] = useState<ServerListItem[]>([]);
  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    serverService.getMyServers().then((list) => {
      if (isMounted) setServers(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <nav
      aria-label="Danh sách máy chủ"
      className="w-[72px] bg-[#030a0d] border-r border-ocean-dark-border flex flex-col items-center py-3 gap-2 flex-shrink-0 z-30 select-none"
    >
      {/* ─── Nút Trang chủ / Direct Messages (@me) ─── */}
      <div
        className="relative group w-full flex justify-center items-center"
        onMouseEnter={() => setHoveredServerId("@me")}
        onMouseLeave={() => setHoveredServerId(null)}
      >
        {/* Left Indicator Pill */}
        <div
          className={cn(
            "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 pointer-events-none",
            isHomeActive
              ? "h-10 opacity-100"
              : hoveredServerId === "@me"
              ? "h-5 opacity-100"
              : "h-0 opacity-0"
          )}
        />

        <Tooltip content="Tin nhắn trực tiếp" side="right">
          <Link
            href="/channels/@me"
            className={cn(
              "w-12 h-12 flex items-center justify-center text-sm font-bold transition-all duration-300 ease-out cursor-pointer relative group",
              isHomeActive
                ? "bg-ocean-primary text-white rounded-[16px] shadow-ocean-glow"
                : "bg-ocean-dark-surface text-ocean-light/90 rounded-[24px] hover:rounded-[16px] hover:bg-ocean-primary hover:text-white hover:shadow-ocean-glow border border-ocean-dark-border"
            )}
            aria-label="Trang chủ & Tin nhắn trực tiếp"
          >
            {/* Discord / Wave Brand Icon */}
            <svg
              className="w-6 h-6 transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </Link>
        </Tooltip>
      </div>

      {/* Đường phân cách */}
      <div className="w-8 h-[2px] bg-ocean-dark-border/80 rounded-full my-0.5" />

      {/* ─── Danh sách Máy chủ (Scrollable) ─── */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 custom-scrollbar pr-0.5">
        {servers.map((server) => {
          const isActive = currentServerId === server.id;
          const isHovered = hoveredServerId === server.id;

          // Tạo chữ viết tắt 1-2 ký tự cho server
          const initials = server.name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();

          return (
            <div
              key={server.id}
              className="relative group w-full flex justify-center items-center"
              onMouseEnter={() => setHoveredServerId(server.id)}
              onMouseLeave={() => setHoveredServerId(null)}
            >
              {/* Left Indicator Pill */}
              <div
                className={cn(
                  "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 pointer-events-none",
                  isActive
                    ? "h-10 opacity-100"
                    : isHovered
                    ? "h-5 opacity-100"
                    : server.hasUnread
                    ? "h-2 opacity-100"
                    : "h-0 opacity-0"
                )}
              />

              <Tooltip content={server.name} side="right">
                <Link
                  href={`/channels/${server.id}`}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center font-bold text-sm transition-all duration-300 ease-out cursor-pointer relative",
                    isActive
                      ? "bg-ocean-primary text-white rounded-[16px] shadow-ocean-glow"
                      : "bg-ocean-dark-surface text-ocean-light rounded-[24px] hover:rounded-[16px] hover:bg-ocean-primary hover:text-white hover:shadow-ocean-glow border border-ocean-dark-border"
                  )}
                  aria-label={server.name}
                >
                  {server.iconUrl ? (
                    <img
                      src={server.iconUrl}
                      alt={server.name}
                      className={cn(
                        "w-full h-full object-cover transition-all duration-300",
                        isActive ? "rounded-[16px]" : "rounded-[24px] hover:rounded-[16px]"
                      )}
                    />
                  ) : (
                    <span className="font-semibold tracking-wider text-xs">{initials}</span>
                  )}

                  {/* Mention Badge */}
                  {server.mentionCount > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[10px] font-black min-w-5 h-5 px-1 flex items-center justify-center rounded-full border-2 border-[#030a0d] shadow-md animate-fade-in pointer-events-none">
                      {server.mentionCount > 99 ? "99+" : server.mentionCount}
                    </div>
                  )}
                </Link>
              </Tooltip>
            </div>
          );
        })}

        {/* Nút Thêm máy chủ (+) */}
        <div
          className="relative group w-full flex justify-center items-center mt-1"
          onMouseEnter={() => setHoveredServerId("add")}
          onMouseLeave={() => setHoveredServerId(null)}
        >
          <div
            className={cn(
              "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 pointer-events-none",
              hoveredServerId === "add" ? "h-5 opacity-100" : "h-0 opacity-0"
            )}
          />
          <Tooltip content="Thêm máy chủ mới" side="right">
            <button
              type="button"
              className="w-12 h-12 flex items-center justify-center text-emerald-400 bg-ocean-dark-surface border border-ocean-dark-border rounded-[24px] hover:rounded-[16px] hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all duration-300 shadow-sm cursor-pointer group"
              aria-label="Tạo máy chủ"
              onClick={() => alert("Chức năng tạo máy chủ: đang kết nối với POST /api/servers")}
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </Tooltip>
        </div>

        {/* Nút Khám phá máy chủ (Compass) */}
        <div
          className="relative group w-full flex justify-center items-center"
          onMouseEnter={() => setHoveredServerId("explore")}
          onMouseLeave={() => setHoveredServerId(null)}
        >
          <div
            className={cn(
              "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 pointer-events-none",
              hoveredServerId === "explore" ? "h-5 opacity-100" : "h-0 opacity-0"
            )}
          />
          <Tooltip content="Khám phá máy chủ cộng đồng" side="right">
            <button
              type="button"
              className="w-12 h-12 flex items-center justify-center text-ocean-secondary bg-ocean-dark-surface border border-ocean-dark-border rounded-[24px] hover:rounded-[16px] hover:bg-ocean-primary hover:text-white hover:border-ocean-secondary transition-all duration-300 shadow-sm cursor-pointer group"
              aria-label="Khám phá máy chủ"
            >
              <svg
                className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>
    </nav>
  );
}

export const ServerSidebar = ServerRail;

