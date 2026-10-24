"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ServerHeaderProps {
  serverName: string;
  isMe: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onInvite?: () => void;
  onSettings?: () => void;
  onCreateChannel?: () => void;
  onLeave?: () => void;
}

export function ServerHeader({
  serverName,
  isMe,
  isOpen,
  onToggle,
  onClose,
  onInvite,
  onSettings,
  onCreateChannel,
  onLeave,
}: ServerHeaderProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !isMe && onToggle()}
        className={cn(
          "h-14 w-full border-b border-ocean-dark-border px-4 flex items-center justify-between transition-colors z-20",
          !isMe ? "hover:bg-white/5 cursor-pointer" : "cursor-default"
        )}
        data-testid="server-header-btn"
      >
        <span className="text-ocean-light text-sm font-bold truncate">
          {isMe ? "Tin nhắn trực tiếp" : serverName}
        </span>
        {!isMe && (
          <svg
            className={cn(
              "w-4 h-4 text-ocean-light/70 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isMe && (
        <div
          data-testid="server-dropdown-menu"
          className="absolute top-[58px] left-2 right-2 bg-[#061829] border border-ocean-dark-border rounded-lg shadow-2xl p-1.5 z-40 animate-fade-in text-xs font-semibold"
        >
          <button
            onClick={() => { onInvite?.(); onClose(); }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-ocean-secondary hover:bg-ocean-primary hover:text-white rounded transition-colors"
          >
            <span>Mời mọi người</span>
            <span>+</span>
          </button>
          <button
            onClick={() => { onSettings?.(); onClose(); }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-ocean-light/80 hover:bg-white/5 rounded transition-colors"
          >
            <span>Cài đặt máy chủ</span>
            <span>⚙️</span>
          </button>
          <button
            onClick={() => { onCreateChannel?.(); onClose(); }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-ocean-light/80 hover:bg-white/5 rounded transition-colors"
          >
            <span>Tạo kênh</span>
            <span>#</span>
          </button>
          <div className="h-px bg-ocean-dark-border my-1" />
          <button
            onClick={() => { onLeave?.(); onClose(); }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-colors"
          >
            <span>Rời khỏi máy chủ</span>
            <span>🚪</span>
          </button>
        </div>
      )}
    </div>
  );
}
