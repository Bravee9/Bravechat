"use client";

import React from "react";
import Link from "next/link";
import type { Channel } from "@discord-clone/shared";
import { cn } from "@/lib/utils";

interface ChannelItemProps {
  channel: Channel;
  serverId: string;
  isActive: boolean;
}

export function ChannelItem({ channel, serverId, isActive }: ChannelItemProps) {
  const isVoice = channel.type === "VOICE" || channel.type === "VIDEO";

  return (
    <Link
      href={`/channels/${serverId}/${channel.id}`}
      data-testid={`channel-item-${channel.id}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-1.5 rounded transition-colors group cursor-pointer text-sm font-medium",
        isActive
          ? "bg-ocean-dark-hover text-white font-semibold"
          : "text-ocean-light/70 hover:bg-white/5 hover:text-ocean-light"
      )}
    >
      {isVoice ? (
        <svg
          className="w-4 h-4 text-ocean-light/50 group-hover:text-ocean-light/80 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 9v6h4l5 4V5L7 9H3zm12-2v2a4 4 0 010 6v2a6 6 0 000-10zm3-3v2a8 8 0 010 12v2a10 10 0 000-16z" />
        </svg>
      ) : (
        <span className="text-ocean-light/50 font-mono text-base leading-none flex-shrink-0">#</span>
      )}

      <span className="flex-1 truncate">{channel.name}</span>

      {channel.mentionCount > 0 && (
        <span
          data-testid={`channel-mention-${channel.id}`}
          className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full"
        >
          {channel.mentionCount}
        </span>
      )}
    </Link>
  );
}
