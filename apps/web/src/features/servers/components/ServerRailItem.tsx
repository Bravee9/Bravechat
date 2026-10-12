"use client";

import React from "react";
import Link from "next/link";
import type { ServerListItem } from "@discord-clone/shared";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface ServerRailItemProps {
  server: ServerListItem;
  isActive: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}

export function ServerRailItem({
  server,
  isActive,
  isHovered,
  onHover,
}: ServerRailItemProps) {
  const initials = server.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative group w-full flex justify-center items-center"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      data-testid={`server-item-${server.id}`}
    >
      {/* Left Indicator Pill */}
      <div
        data-testid={`server-pill-${server.id}`}
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
            <div
              data-testid={`server-badge-${server.id}`}
              className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[10px] font-black min-w-5 h-5 px-1 flex items-center justify-center rounded-full border-2 border-[#030a0d] shadow-md animate-fade-in pointer-events-none"
            >
              {server.mentionCount > 99 ? "99+" : server.mentionCount}
            </div>
          )}
        </Link>
      </Tooltip>
    </div>
  );
}
