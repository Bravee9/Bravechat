"use client";

import React, { memo, useState } from "react";
import Link from "next/link";
import type { ServerListItem } from "@discord-clone/shared";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { loadServerDetail, loadServerMembers, workspaceStore } from "@/stores/workspace.store";
import {
  getDeterministicJetBrainsColor,
  useServerWorkspaceConfig,
} from "@/stores/ide-workspace.store";

interface ServerRailItemProps {
  server: ServerListItem;
  isActive: boolean;
  /** Tùy chọn: nếu không truyền, item tự quản hover (tránh re-render cả rail). */
  isHovered?: boolean;
  onHover?: (hovered: boolean) => void;
}

function ServerRailItemBase({
  server,
  isActive,
  isHovered: isHoveredProp,
  onHover: onHoverProp,
}: ServerRailItemProps) {
  const [localHovered, setLocalHovered] = useState(false);
  const isHovered = isHoveredProp ?? localHovered;
  const config = useServerWorkspaceConfig(server.id);
  const cachedFirstChannelId = useStore(workspaceStore, (state) => {
    const channels = state.serverDetails[server.id]?.channels;
    if (!channels?.length) return null;
    return channels.slice().sort((a, b) => a.position - b.position)[0]?.id ?? null;
  });
  const badgeColor =
    server.badgeColor || config.badgeColor || getDeterministicJetBrainsColor(server.id || server.name);

  const onHover = (hovered: boolean) => {
    setLocalHovered(hovered);
    onHoverProp?.(hovered);
    if (hovered) {
      void loadServerDetail(server.id);
      void loadServerMembers(server.id);
    }
  };

  const initials = server.name
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || server.name.slice(0, 2).toUpperCase();

  return (
    <div
      className="relative group w-full flex justify-center items-center shrink-0"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      data-testid={`server-item-${server.id}`}
    >
      {/* Left Indicator Pill */}
      <div
        data-testid={`server-pill-${server.id}`}
        className={cn(
          "absolute left-0 w-1 rounded-r-full transition-all duration-200 pointer-events-none",
          isActive
            ? "h-10 opacity-100 bg-[#087CFA]"
            : isHovered
            ? "h-5 opacity-100 bg-[#CDCDCD]"
            : server.hasUnread
            ? "h-2 opacity-100 bg-white"
            : "h-0 opacity-0 bg-white"
        )}
      />

      <Tooltip content={server.name} side="right">
        <Link
          href={
            cachedFirstChannelId
              ? `/channels/${encodeURIComponent(server.id)}/${encodeURIComponent(cachedFirstChannelId)}`
              : `/channels/${encodeURIComponent(server.id)}`
          }
          scroll={false}
          onFocus={() => {
            void loadServerDetail(server.id);
            void loadServerMembers(server.id);
          }}
          className={cn(
            "w-11 h-11 flex items-center justify-center font-mono font-bold text-xs transition-all duration-200 cursor-pointer relative rounded-[8px] border",
            isActive
              ? "bg-[#214283] border-[#087CFA] text-white ring-1 ring-[#087CFA]/50"
              : "bg-[#1E1F22] border-[#2B2D30] text-[#E6EDF3] hover:bg-[#2B2D30] hover:border-[#393B40]"
          )}
          aria-label={server.name}
        >
          {server.iconUrl ? (
            <img
              src={server.iconUrl}
              alt={server.name}
              className="w-full h-full object-cover rounded-[7px]"
            />
          ) : (
            <span
              className="w-7 h-7 rounded-[4px] flex items-center justify-center font-mono font-extrabold text-[11px] text-[#0B0B0D] tracking-tight"
              style={{ backgroundColor: badgeColor }}
            >
              {initials}
            </span>
          )}

          {/* Mention Badge */}
          {server.mentionCount > 0 && (
            <div
              data-testid={`server-badge-${server.id}`}
              className="absolute -bottom-1 -right-1 bg-[#FE2857] text-white text-[10px] font-mono font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full border-2 border-[#141417] shadow-md pointer-events-none"
            >
              {server.mentionCount > 99 ? "99+" : server.mentionCount}
            </div>
          )}
        </Link>
      </Tooltip>
    </div>
  );
}

export const ServerRailItem = memo(ServerRailItemBase);
