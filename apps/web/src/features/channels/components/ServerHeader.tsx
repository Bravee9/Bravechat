"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getDeterministicJetBrainsColor } from "@/stores/ide-workspace.store";

interface ServerHeaderProps {
  serverName: string;
  badgeColor?: string;
  isMe: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onInvite?: () => void;
  onSettings?: () => void;
  onRoles?: () => void;
  onMembers?: () => void;
  onCreateChannel?: () => void;
  onLeave?: () => void;
}

export function ServerHeader({
  serverName,
  badgeColor,
  isMe,
  isOpen,
  onToggle,
  onClose,
  onInvite,
  onSettings,
  onRoles,
  onMembers,
  onCreateChannel,
  onLeave,
}: ServerHeaderProps) {
  const color = badgeColor || getDeterministicJetBrainsColor(serverName || "SV");
  const initials = (serverName || "SV")
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "SV";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !isMe && onToggle()}
        className={cn(
          "h-12 w-full border-b border-[#2B2D30] px-3.5 flex items-center justify-between transition-colors z-20 bg-[#18181B]",
          !isMe ? "hover:bg-[#24262B] cursor-pointer" : "cursor-default"
        )}
        data-testid="server-header-btn"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {!isMe ? (
            <span
              className="w-5 h-5 rounded-[3px] flex items-center justify-center font-mono font-extrabold text-[10px] text-[#0B0B0D] shrink-0"
              style={{ backgroundColor: color }}
            >
              {initials}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-xs bg-[#087CFA] shrink-0" />
          )}
          <span className="text-[#E6EDF3] text-[13px] font-bold truncate">
            {isMe ? "Tin nhắn trực tiếp" : serverName}
          </span>
        </div>
        {!isMe && (
          <svg
            className={cn(
              "w-3.5 h-3.5 text-[#A8A8B0] transition-transform duration-200 shrink-0",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isMe && (
        <div
          data-testid="server-dropdown-menu"
          className="absolute top-[46px] left-2 right-2 bg-[#1E1F22] border border-[#2B2D30] rounded-[4px] shadow-[0_16px_40px_rgba(0,0,0,0.75)] p-1.5 z-40 animate-fade-in text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => {
              onInvite?.();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-[#07C3F2] hover:bg-[#214283] hover:text-white rounded-[3px] transition-colors cursor-pointer"
          >
            <span>Mời mọi người</span>
            <span className="font-mono">+</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSettings?.();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-[#E6EDF3] hover:bg-[#2B2D30] rounded-[3px] transition-colors cursor-pointer"
          >
            <span>Cài đặt máy chủ</span>
            <span className="font-mono text-[10px] text-[#7D7D7D]">CFG</span>
          </button>
          {onRoles && (
            <button
              type="button"
              onClick={() => {
                onRoles();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 text-[#E6EDF3] hover:bg-[#2B2D30] rounded-[3px] transition-colors cursor-pointer"
            >
              <span>Vai trò & Phân quyền</span>
              <span className="font-mono text-[10px] text-[#21D789]">RBAC</span>
            </button>
          )}
          {onMembers && (
            <button
              type="button"
              onClick={() => {
                onMembers();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 text-[#E6EDF3] hover:bg-[#2B2D30] rounded-[3px] transition-colors cursor-pointer"
            >
              <span>Quản lý thành viên</span>
              <span className="font-mono text-[10px] text-[#7D7D7D]">USR</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onCreateChannel?.();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-[#E6EDF3] hover:bg-[#2B2D30] rounded-[3px] transition-colors cursor-pointer"
          >
            <span>Tạo kênh</span>
            <span className="font-mono text-[#7D7D7D]">#</span>
          </button>
          <div className="h-px bg-[#2B2D30] my-1" />
          <button
            type="button"
            onClick={() => {
              onLeave?.();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-[#FE2857] hover:bg-[#FE2857] hover:text-white rounded-[3px] transition-colors cursor-pointer"
          >
            <span>Rời khỏi máy chủ</span>
            <span className="font-mono text-[10px]">EXIT</span>
          </button>
        </div>
      )}
    </div>
  );
}
