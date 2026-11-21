"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CurrentUser } from "@discord-clone/shared";
import { cn } from "@/lib/utils";
import { http } from "@/services/http";
import { workspaceStore } from "@/stores/workspace.store";
import {
  CheckIcon,
  MonitorIcon,
  PencilIcon,
  SettingsIcon,
  ShieldIcon,
  SparkIcon,
  TerminalIcon,
} from "@/components/ui/Icons";

interface QuickProfilePopoverProps {
  currentUser: CurrentUser;
  onClose: () => void;
  onOpenFullSettings: (initialTab?: string) => void;
}

export function QuickProfilePopover({
  currentUser,
  onClose,
  onOpenFullSettings,
}: QuickProfilePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const changeStatus = async (status: CurrentUser["status"]) => {
    setUpdatingStatus(true);
    try {
      const res = await http.patch<{ user: CurrentUser }>("/users/@me/status", { status });
      workspaceStore.set({ currentUser: res.user });
      setStatusMenuOpen(false);
    } catch {
      // ignore
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusColors = {
    ONLINE: "bg-emerald-500",
    IDLE: "bg-amber-500",
    DO_NOT_DISTURB: "bg-rose-500",
    INVISIBLE: "bg-slate-500",
    OFFLINE: "bg-slate-600",
  };

  const statusLabels = {
    ONLINE: "Trực tuyến",
    IDLE: "Chờ",
    DO_NOT_DISTURB: "Không làm phiền",
    INVISIBLE: "Vô hình",
    OFFLINE: "Ngoại tuyến",
  };

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-14 left-0 w-72 sm:w-80 bg-[#1E1F22] border border-[#393B40] rounded-[8px] shadow-2xl overflow-hidden z-50 text-[#DFE1E5] select-none"
      data-testid="quick-profile-popover"
    >
      {/* Top Banner */}
      <div className="h-20 w-full bg-gradient-to-r from-[#214283] via-[#087CFA]/40 to-[#141417] relative border-b border-[#2B2D30]">
        {currentUser.bannerUrl && (
          <img
            src={currentUser.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Avatar & Badges row */}
      <div className="px-4 relative flex justify-between items-end -mt-9 mb-2">
        <div className="relative">
          <div className="w-18 h-18 rounded-full border-4 border-[#1E1F22] overflow-hidden bg-[#141417] shadow-lg flex items-center justify-center font-bold text-xl text-[#07C3F2]">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (currentUser.displayName?.[0] || currentUser.username[0] || "B").toUpperCase()
            )}
          </div>
          <div
            className={cn(
              "absolute bottom-0.5 right-0.5 w-4.5 h-4.5 rounded-full border-3 border-[#1E1F22]",
              statusColors[currentUser.status || "ONLINE"]
            )}
            title={statusLabels[currentUser.status || "ONLINE"]}
          />
        </div>

        {/* Badges container */}
        <div className="flex items-center gap-1.5 bg-[#141417] border border-[#2B2D30] px-2 py-1 rounded-[4px] shadow-sm">
          <span title="Việt Nam" className="text-[10px] font-mono font-bold text-[#A8A8B0]">
            VN
          </span>

          {/* MATH Badge */}
          <div
            className="flex items-center gap-1 bg-[#214283]/50 border border-[#087CFA]/50 text-[#DFE1E5] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[3px]"
            title="Bravemath Member"
          >
            <img
              src="/bravemath-icon-white-128.png"
              alt=""
              className="w-3 h-3 object-contain"
            />
            <span>MATH</span>
          </div>

          {/* NITRO Badge */}
          <div
            className="flex items-center gap-1 bg-purple-500/15 border border-purple-500/35 text-purple-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[3px]"
            title="Brave Nitro VIP"
          >
            <SparkIcon className="w-3 h-3" />
            <span>NITRO</span>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="px-4 pt-1 pb-3 border-b border-[#2B2D30]">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-base text-[#F2F2F3] leading-tight">
            {currentUser.displayName || currentUser.username}
          </h3>
          <span className="text-[#07C3F2]" title="Đã xác minh">
            <CheckIcon className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7D7D7D] font-mono mt-0.5">
          <span>{currentUser.username}</span>
          <span>·</span>
          <span>He/Him</span>
        </div>

        {/* Custom Bio / Link */}
        <div className="mt-2.5 text-xs text-[#CDCDCD] leading-snug">
          <a
            href="https://bravee9.github.io/bravemath/"
            target="_blank"
            rel="noreferrer"
            className="text-[#07C3F2] hover:underline break-all"
          >
            https://bravee9.github.io/bravemath/
          </a>
          {currentUser.bio && (
            <p className="mt-1 text-[#A8A8B0] italic text-[11px]">{currentUser.bio}</p>
          )}
        </div>

        {/* Activity Status Card */}
        <div className="mt-3 bg-[#141417] rounded-[6px] p-2.5 border border-[#2B2D30] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-[#1E1F22] border border-[#2B2D30] flex items-center justify-center text-[#07C3F2]">
              <TerminalIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-[#E6EDF3] text-[11px] uppercase tracking-wider">
                Không gian làm việc
              </p>
              <p className="text-[11px] text-[#7D7D7D]">Đang hoạt động · Bravechat</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#7D7D7D]">Live</span>
        </div>
      </div>

      {/* Menu Actions */}
      <div className="p-2 space-y-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullSettings("account");
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] hover:bg-[#2B2D30] text-[#E6EDF3] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <PencilIcon className="w-3.5 h-3.5 text-[#A8A8B0]" />
            <span>Sửa Hồ Sơ</span>
          </div>
          <span className="text-[#7D7D7D]">›</span>
        </button>

        {/* Change Status Popover/Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] hover:bg-[#2B2D30] text-[#E6EDF3] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className={cn("w-2.5 h-2.5 rounded-full", statusColors[currentUser.status || "ONLINE"])} />
              <span>{statusLabels[currentUser.status || "ONLINE"]}</span>
            </div>
            <span className="text-[#7D7D7D]">›</span>
          </button>

          {statusMenuOpen && (
            <div className="absolute left-full -bottom-2 ml-1 w-44 bg-[#18181B] border border-[#393B40] rounded-[6px] shadow-xl p-1 z-50">
              {(["ONLINE", "IDLE", "DO_NOT_DISTURB", "INVISIBLE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => changeStatus(s)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] hover:bg-[#2B2D30] text-xs text-[#E6EDF3] text-left transition-colors cursor-pointer"
                >
                  <span className={cn("w-2 h-2 rounded-full", statusColors[s])} />
                  <span>{statusLabels[s]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullSettings("security");
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] hover:bg-[#2B2D30] text-[#E6EDF3] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <ShieldIcon className="w-3.5 h-3.5 text-[#A8A8B0]" />
            <span>Mật Khẩu & 2FA</span>
          </div>
          <span className="text-[#7D7D7D]">›</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullSettings("devices");
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] hover:bg-[#2B2D30] text-[#E6EDF3] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <MonitorIcon className="w-3.5 h-3.5 text-[#A8A8B0]" />
            <span>Thiết Bị Đã Đăng Nhập</span>
          </div>
          <span className="text-[#7D7D7D]">›</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullSettings("account");
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] hover:bg-[#2B2D30] text-[#E6EDF3] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-3.5 h-3.5 text-[#A8A8B0]" />
            <span>Quản Lý Tài Khoản</span>
          </div>
          <span className="text-[#7D7D7D]">›</span>
        </button>
      </div>
    </div>
  );
}
