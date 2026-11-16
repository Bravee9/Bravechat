"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CurrentUser } from "@discord-clone/shared";
import { cn } from "@/lib/utils";
import { http } from "@/services/http";
import { workspaceStore } from "@/stores/workspace.store";

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
      className="absolute bottom-16 left-3 w-80 bg-[#071A2C] border border-ocean-dark-border rounded-2xl shadow-2xl overflow-hidden z-50 text-ocean-light animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
      data-testid="quick-profile-popover"
    >
      {/* Top Banner */}
      <div className="h-20 w-full bg-gradient-to-r from-ocean-primary/80 via-ocean-secondary/60 to-ocean-dark-surface relative">
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
          <div className="w-18 h-18 rounded-full border-4 border-[#071A2C] overflow-hidden bg-ocean-dark-surface shadow-lg flex items-center justify-center font-bold text-xl text-ocean-secondary">
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
              "absolute bottom-0.5 right-0.5 w-4.5 h-4.5 rounded-full border-3 border-[#071A2C]",
              statusColors[currentUser.status || "ONLINE"]
            )}
            title={statusLabels[currentUser.status || "ONLINE"]}
          />
        </div>

        {/* Badges container */}
        <div className="flex items-center gap-1.5 bg-[#051424]/90 backdrop-blur-sm border border-ocean-dark-border/60 px-2 py-1 rounded-lg shadow-sm">
          {/* Vietnam Flag Badge */}
          <span title="Việt Nam" className="text-sm">
            🇻🇳
          </span>

          {/* MATH Badge */}
          <div
            className="flex items-center gap-1 bg-ocean-primary/30 border border-ocean-primary/50 text-ocean-light text-[10px] font-bold px-1.5 py-0.5 rounded"
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
            className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded"
            title="Brave Nitro VIP"
          >
            <span>✦</span>
            <span>NITRO</span>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="px-4 pt-1 pb-3 border-b border-ocean-dark-border/40">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-base text-ocean-light leading-tight">
            {currentUser.displayName || currentUser.username}
          </h3>
          <span className="text-ocean-secondary" title="Đã xác minh">
            ✓
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ocean-light/50 font-mono mt-0.5">
          <span>{currentUser.username}</span>
          <span>·</span>
          <span>He/Him</span>
        </div>

        {/* Custom Bio / Link */}
        <div className="mt-2.5 text-xs text-ocean-light/80 leading-snug">
          <a
            href="https://bravee9.github.io/bravemath/"
            target="_blank"
            rel="noreferrer"
            className="text-ocean-secondary hover:underline break-all"
          >
            https://bravee9.github.io/bravemath/
          </a>
          {currentUser.bio && (
            <p className="mt-1 text-ocean-light/70 italic text-[11px]">{currentUser.bio}</p>
          )}
        </div>

        {/* Activity Status Card */}
        <div className="mt-3 bg-[#051424] rounded-lg p-2.5 border border-ocean-dark-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">🎮</span>
            <div>
              <p className="font-semibold text-ocean-light/90 text-[11px] uppercase tracking-wider">
                Bộ Sưu Tập Trò Chơi
              </p>
              <p className="text-[11px] text-ocean-light/50">Đang chơi · Brave Arena</p>
            </div>
          </div>
          <span className="text-xs text-ocean-light/40">1 giờ trước</span>
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
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-ocean-light/85 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm">✎</span>
            <span>Sửa Hồ Sơ</span>
          </div>
          <span className="text-ocean-light/40">›</span>
        </button>

        {/* Change Status Popover/Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-ocean-light/85 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className={cn("w-2.5 h-2.5 rounded-full", statusColors[currentUser.status || "ONLINE"])} />
              <span>{statusLabels[currentUser.status || "ONLINE"]}</span>
            </div>
            <span className="text-ocean-light/40">›</span>
          </button>

          {statusMenuOpen && (
            <div className="absolute left-full -bottom-2 ml-1 w-44 bg-[#051424] border border-ocean-dark-border rounded-xl shadow-xl p-1 z-50">
              {(["ONLINE", "IDLE", "DO_NOT_DISTURB", "INVISIBLE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => changeStatus(s)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-ocean-light text-left transition-colors"
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
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-ocean-light/85 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm">🛡️</span>
            <span>Mật Khẩu & 2FA</span>
          </div>
          <span className="text-ocean-light/40">›</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullSettings("devices");
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-ocean-light/85 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm">💻</span>
            <span>Thiết Bị Đã Đăng Nhập</span>
          </div>
          <span className="text-ocean-light/40">›</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullSettings("account");
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-ocean-light/85 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm">⚙️</span>
            <span>Quản Lý Tài Khoản</span>
          </div>
          <span className="text-ocean-light/40">›</span>
        </button>
      </div>
    </div>
  );
}
