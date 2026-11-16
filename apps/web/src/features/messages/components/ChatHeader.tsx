"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  channelName: string;
  serverName?: string;
  isMe: boolean;
  isChannelTopic: boolean;
  isPrivateChannel?: boolean;
  currentUser: string;
  connectionStatus: "connecting" | "connected" | "disconnected";
  showMemberList: boolean;
  onChangeUsername: () => void;
  onReconnectWs: () => void;
  onToggleMemberList: () => void;
  onToggleChannelPrivacy?: () => void;
  onOpenWorkspaceSettings?: () => void;
}

export function ChatHeader({
  channelName,
  serverName,
  isMe,
  isChannelTopic,
  isPrivateChannel = false,
  currentUser,
  connectionStatus,
  showMemberList,
  onChangeUsername,
  onReconnectWs,
  onToggleMemberList,
  onToggleChannelPrivacy,
  onOpenWorkspaceSettings,
}: ChatHeaderProps) {
  return (
    <header
      data-testid="chat-header"
      className="h-12 border-b border-[#2B2D30] px-4 flex items-center justify-between flex-shrink-0 z-10 bg-[#18181B] select-none"
    >
      {/* Left: JetBrains IDE Tab & Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#214283]/45 border border-[#087CFA]/50 min-w-0">
          {isMe ? (
            <span className="text-[#07C3F2] font-mono text-sm">@</span>
          ) : isPrivateChannel ? (
            <span className="text-[#FDB60D] font-mono text-xs" title="Kênh riêng tư">
              🔒
            </span>
          ) : (
            <span className="text-[#07C3F2] font-mono text-sm">#</span>
          )}
          <h1 className="text-white font-semibold text-xs sm:text-[13px] truncate">
            {channelName}
          </h1>
        </div>

        {isChannelTopic && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#7D7D7D] font-mono truncate">
            <span>/</span>
            {serverName && <span className="text-[#A8A8B0]">{serverName}</span>}
            <span>·</span>
            <span className="truncate">
              {isPrivateChannel
                ? "Kênh riêng tư (Chỉ vai trò được cấp quyền)"
                : "Kênh trò chuyện thời gian thực"}
            </span>
          </div>
        )}
      </div>

      {/* Right: IDE Action Toolbar */}
      <div className="flex items-center gap-2">
        {!isMe && onToggleChannelPrivacy && (
          <button
            type="button"
            onClick={onToggleChannelPrivacy}
            data-testid="header-toggle-privacy-btn"
            title={
              isPrivateChannel
                ? "Đang khóa riêng tư — Nhấn để cấu hình quyền kênh"
                : "Đặt kênh này thành Kênh riêng tư"
            }
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[4px] border transition-colors cursor-pointer",
              isPrivateChannel
                ? "border-[#FDB60D]/50 bg-[#FDB60D]/15 text-[#FDB60D] hover:bg-[#FDB60D]/25"
                : "border-[#2B2D30] bg-[#1E1F22] text-[#A8A8B0] hover:text-white hover:border-[#393B40]"
            )}
          >
            <span>{isPrivateChannel ? "🔒 Riêng tư" : "🔓 Công khai"}</span>
          </button>
        )}

        {!isMe && onOpenWorkspaceSettings && (
          <button
            type="button"
            onClick={onOpenWorkspaceSettings}
            data-testid="header-open-settings-btn"
            title="Mở Quản trị máy chủ & Phân quyền (RBAC)"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[4px] border border-[#2B2D30] bg-[#1E1F22] hover:bg-[#2B2D30] text-[#E6EDF3] transition-colors cursor-pointer"
          >
            <span className="text-[#07C3F2]">⚙</span>
            <span>Quản trị</span>
          </button>
        )}

        {/* Tên user hiện tại */}
        <button
          type="button"
          onClick={onChangeUsername}
          title="Xem hồ sơ của bạn"
          data-testid="change-username-btn"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#2B2D30] bg-[#1E1F22] hover:bg-[#2B2D30] text-[#E6EDF3] transition-all rounded-[4px] cursor-pointer"
        >
          <span className="text-[#7D7D7D]">Tôi:</span>
          <span className="font-semibold text-[#07C3F2]">{currentUser}</span>
        </button>

        {/* Trạng thái WS */}
        <div
          data-testid="ws-connection-badge"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[4px] border border-[#2B2D30] bg-[#141417]"
        >
          {connectionStatus === "connected" && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#21D789] font-medium">Live</span>
            </>
          )}
          {connectionStatus === "connecting" && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[#FDB60D] font-medium">Kết nối...</span>
            </>
          )}
          {connectionStatus === "disconnected" && (
            <button
              type="button"
              onClick={onReconnectWs}
              className="flex items-center gap-1 text-[#FE2857] hover:underline font-medium cursor-pointer"
              title="Nhấn để kết nối lại"
            >
              <span className="w-2 h-2 rounded-full bg-[#FE2857]" />
              <span>Mất kết nối ↺</span>
            </button>
          )}
        </div>

        {/* Toggle Member List */}
        {!isMe && (
          <Tooltip
            content={
              showMemberList
                ? "Ẩn danh sách thành viên"
                : "Hiện danh sách thành viên"
            }
            side="bottom"
          >
            <button
              type="button"
              onClick={onToggleMemberList}
              data-testid="toggle-member-list-btn"
              className={cn(
                "p-1.5 rounded-[4px] border transition-colors cursor-pointer",
                showMemberList
                  ? "bg-[#214283]/45 border-[#087CFA]/50 text-white"
                  : "border-[#2B2D30] bg-[#1E1F22] text-[#7D7D7D] hover:text-white"
              )}
              aria-label="Toggle Members"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
