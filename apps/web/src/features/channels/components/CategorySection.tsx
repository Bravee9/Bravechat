"use client";

import React, { useState } from "react";
import type { Channel, ChannelCategory } from "@discord-clone/shared";
import { ChannelItem } from "./ChannelItem";
import { cn } from "@/lib/utils";

interface CategorySectionProps {
  category: ChannelCategory;
  channels: Channel[];
  serverId: string;
  currentChannelId: string;
  onCreateChannel?: () => void;
}

export function CategorySection({
  category,
  channels,
  serverId,
  currentChannelId,
  onCreateChannel,
}: CategorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="space-y-0.5" data-testid={`category-section-${category.id}`}>
      {/* Category Header */}
      <div className="flex items-center justify-between px-2 py-1 text-ocean-light/50 text-[11px] font-extrabold uppercase tracking-wider group">
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex items-center gap-1 cursor-pointer hover:text-ocean-light/80 text-left"
          data-testid={`category-toggle-${category.id}`}
        >
          <svg
            className={cn(
              "w-3 h-3 transition-transform duration-150",
              isCollapsed && "-rotate-90"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="truncate">{category.name}</span>
        </button>

        <button
          type="button"
          onClick={onCreateChannel}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
          title="Tạo kênh mới trong danh mục này"
        >
          +
        </button>
      </div>

      {/* Channels List */}
      {!isCollapsed && (
        <div className="space-y-0.5">
          {channels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              serverId={serverId}
              isActive={currentChannelId === channel.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
