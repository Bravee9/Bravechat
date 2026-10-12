"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  channelName: string;
  isMe: boolean;
  isChannelTopic: boolean;
  currentUser: string;
  connectionStatus: "connecting" | "connected" | "disconnected";
  showMemberList: boolean;
  onChangeUsername: () => void;
  onReconnectWs: () => void;
  onToggleMemberList: () => void;
}

export function ChatHeader({
  channelName,
  isMe,
  isChannelTopic,
  currentUser,
  connectionStatus,
  showMemberList,
  onChangeUsername,
  onReconnectWs,
  onToggleMemberList,
}: ChatHeaderProps) {
  return (
    <header
      data-testid="chat-header"
      className="h-14 border-b border-ocean-dark-border px-6 flex items-center justify-between flex-shrink-0 z-10 bg-ocean-dark-bg/80 backdrop-blur-md select-none"
    >
      <div className="flex items-center gap-3 min-w-0">
        {isMe ? (
          <span className="text-ocean-secondary text-lg">@</span>
        ) : (
          <span className="text-ocean-light/50 font-mono text-xl">#</span>
        )}
        <h1 className="text-ocean-light font-bold text-base truncate">
          {channelName}
        </h1>
        {isChannelTopic && (
          <>
            <div className="h-4 w-px bg-ocean-dark-border mx-1" />
            <span className="text-ocean-light/50 text-xs hidden md:inline truncate max-w-sm">
              Kênh trò chuyện thời gian thực
            </span>
          </>
        )}
      </div>

      {/* Action Toolbar bên phải */}
      <div className="flex items-center gap-2.5">
        {/* Tên test user */}
        <button
          onClick={onChangeUsername}
          title="Nhấn để đổi tên test"
          data-testid="change-username-btn"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-ocean-dark-border bg-ocean-dark-surface/60 hover:bg-ocean-dark-surface hover:border-ocean-secondary/50 text-ocean-light transition-all rounded"
        >
          <span className="text-ocean-light/50">Tôi:</span>
          <span className="font-bold text-ocean-secondary">{currentUser}</span>
          <span className="text-[10px] text-ocean-light/40">✏️</span>
        </button>

        {/* Trạng thái WS */}
        <div
          data-testid="ws-connection-badge"
          className="flex items-center gap-2 px-2.5 py-1 text-xs rounded border border-ocean-dark-border bg-ocean-dark-surface/40"
        >
          {connectionStatus === "connected" && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-medium">Live</span>
            </>
          )}
          {connectionStatus === "connecting" && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-amber-400 font-medium">Kết nối...</span>
            </>
          )}
          {connectionStatus === "disconnected" && (
            <button
              onClick={onReconnectWs}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              title="Nhấn để kết nối lại"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Mất kết nối ↺</span>
            </button>
          )}
        </div>

        {/* Toggle Member List */}
        {!isMe && (
          <Tooltip content={showMemberList ? "Ẩn danh sách thành viên" : "Hiện danh sách thành viên"} side="bottom">
            <button
              onClick={onToggleMemberList}
              data-testid="toggle-member-list-btn"
              className={cn(
                "p-2 rounded hover:bg-white/10 transition-colors cursor-pointer",
                showMemberList ? "text-ocean-light" : "text-ocean-light/40"
              )}
              aria-label="Toggle Members"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
