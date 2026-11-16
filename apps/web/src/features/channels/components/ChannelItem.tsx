"use client";

import React from "react";
import Link from "next/link";
import type { Channel } from "@discord-clone/shared";
import { cn } from "@/lib/utils";
import { useServerWorkspaceConfig } from "@/stores/ide-workspace.store";

interface ChannelItemProps {
  channel: Channel;
  serverId: string;
  isActive: boolean;
}

export function ChannelItem({ channel, serverId, isActive }: ChannelItemProps) {
  const isVoice = channel.type === "VOICE" || channel.type === "VIDEO";
  const config = useServerWorkspaceConfig(serverId);
  const isPrivate = Boolean(config.channelPolicies[channel.id]?.isPrivate);

  return (
    <Link
      href={`/channels/${serverId}/${channel.id}`}
      scroll={false}
      data-testid={`channel-item-${channel.id}`}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] transition-colors group cursor-pointer text-[13px] font-medium border-l-2",
        isActive
          ? "bg-ocean-dark-hover border-[#087CFA] text-white font-semibold"
          : "border-transparent text-[#A8A8B0] hover:bg-[#24262B] hover:text-[#E6EDF3]"
      )}
    >
      {isVoice ? (
        <svg
          className={cn(
            "w-3.5 h-3.5 flex-shrink-0",
            isActive ? "text-[#21D789]" : "text-[#7D7D7D] group-hover:text-[#CDCDCD]"
          )}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 9v6h4l5 4V5L7 9H3zm12-2v2a4 4 0 010 6v2a6 6 0 000-10zm3-3v2a8 8 0 010 12v2a10 10 0 000-16z" />
        </svg>
      ) : (
        <span
          className={cn(
            "font-mono text-sm leading-none flex-shrink-0",
            isActive ? "text-[#07C3F2]" : "text-[#7D7D7D]"
          )}
        >
          #
        </span>
      )}

      <span className="flex-1 truncate">{channel.name}</span>

      {isPrivate && (
        <span
          title="Kênh riêng tư — giới hạn vai trò"
          data-testid={`channel-lock-${channel.id}`}
          className="text-[10px] font-mono text-[#FDB60D] bg-[#FDB60D]/15 border border-[#FDB60D]/30 px-1 rounded-[2px] flex-shrink-0"
        >
          🔒
        </span>
      )}

      {channel.mentionCount > 0 && (
        <span
          data-testid={`channel-mention-${channel.id}`}
          className="bg-[#FE2857] text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full"
        >
          {channel.mentionCount}
        </span>
      )}
    </Link>
  );
}
