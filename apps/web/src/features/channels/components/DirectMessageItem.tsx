"use client";

import React from "react";
import Link from "next/link";
import type { DirectConversation } from "@discord-clone/shared";
import { cn } from "@/lib/utils";

interface DirectMessageItemProps {
  conversation: DirectConversation;
  isActive: boolean;
}

export function DirectMessageItem({
  conversation,
  isActive,
}: DirectMessageItemProps) {
  const { recipient, hasUnread } = conversation;

  return (
    <Link
      href={`/channels/@me/${conversation.id}`}
      data-testid={`dm-item-${conversation.id}`}
      className={cn(
        "flex items-center gap-3 px-2.5 py-2 rounded transition-colors group cursor-pointer relative",
        isActive
          ? "bg-ocean-primary/20 text-ocean-light border border-ocean-primary/30"
          : "text-ocean-light/75 hover:bg-white/5 hover:text-ocean-light"
      )}
    >
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-ocean-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {recipient.displayName?.[0] || recipient.username[0]?.toUpperCase()}
        </div>
        {/* Presence status badge */}
        <span
          data-testid={`dm-status-${recipient.status}`}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-ocean-dark-surface",
            recipient.status === "ONLINE" && "bg-emerald-500",
            recipient.status === "IDLE" && "bg-amber-500",
            recipient.status === "DO_NOT_DISTURB" && "bg-rose-500",
            recipient.status === "OFFLINE" && "bg-slate-500"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {recipient.displayName || recipient.username}
        </p>
        <p className="text-[11px] text-ocean-light/40 truncate">
          {recipient.status.toLowerCase()}
        </p>
      </div>

      {hasUnread && (
        <span
          data-testid="dm-unread-dot"
          className="w-2 h-2 rounded-full bg-ocean-secondary"
        />
      )}
    </Link>
  );
}
