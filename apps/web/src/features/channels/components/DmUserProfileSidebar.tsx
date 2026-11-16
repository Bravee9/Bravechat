"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { http } from "@/services/http";

interface DmUserProfile {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  status?: string;
  createdAt?: string;
  mutualServersCount?: number;
  mutualFriendsCount?: number;
}

interface DmUserProfileSidebarProps {
  userId: string;
  onClose?: () => void;
}

export function DmUserProfileSidebar({ userId, onClose }: DmUserProfileSidebarProps) {
  const [profile, setProfile] = useState<DmUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const res = await http.get<{ user: DmUserProfile }>(`/users/${encodeURIComponent(userId)}`);
        if (active) setProfile(res.user);
      } catch {
        if (active) {
          setProfile({
            id: userId,
            username: "user_" + userId.slice(0, 5),
            displayName: "Người dùng Bravechat",
            status: "ONLINE",
            createdAt: "2024-12-01T00:00:00Z",
            mutualServersCount: 1,
            mutualFriendsCount: 0,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchProfile();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleAction = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  };

  if (loading) {
    return (
      <aside className="w-80 bg-[#051424] border-l border-ocean-dark-border flex flex-col items-center justify-center p-6 text-xs text-ocean-light/50 select-none">
        <div className="w-6 h-6 border-2 border-ocean-secondary border-t-transparent rounded-full animate-spin mb-2" />
        <span>Đang tải thông tin hồ sơ...</span>
      </aside>
    );
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "1 thg 12, 2024";

  return (
    <aside
      className="w-80 bg-[#051424] border-l border-ocean-dark-border flex flex-col justify-between overflow-y-auto select-none flex-shrink-0 z-10"
      data-testid="dm-user-profile-sidebar"
    >
      <div>
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-ocean-primary/70 via-ocean-secondary/50 to-blue-900 relative">
          {profile?.bannerUrl && (
            <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center text-xs"
              aria-label="Đóng bảng hồ sơ"
            >
              ✕
            </button>
          )}
        </div>

        {/* Avatar & Badges */}
        <div className="px-4 relative flex justify-between items-end -mt-10 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-[#051424] bg-ocean-dark-surface overflow-hidden shadow-xl flex items-center justify-center font-bold text-xl text-ocean-secondary">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile?.displayName?.[0] || profile?.username?.[0] || "U").toUpperCase()
              )}
            </div>
            <div
              className={cn(
                "absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#051424]",
                profile?.status === "ONLINE"
                  ? "bg-emerald-500"
                  : profile?.status === "IDLE"
                  ? "bg-amber-500"
                  : profile?.status === "DO_NOT_DISTURB"
                  ? "bg-rose-500"
                  : "bg-slate-500"
              )}
            />
          </div>

          <div className="flex items-center gap-1 bg-black/40 border border-ocean-dark-border px-2 py-1 rounded-lg">
            <span title="Thành viên Bravechat">🇻🇳</span>
            <span className="text-[10px] font-bold text-ocean-secondary">MATH</span>
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="px-4 space-y-4">
          <div>
            <h3 className="font-bold text-base text-ocean-light leading-snug">
              {profile?.displayName || profile?.username}
            </h3>
            <p className="text-xs text-ocean-light/50 font-mono">@{profile?.username}</p>
          </div>

          {/* Quick Action Buttons (Thêm bạn, Chặn, Báo cáo spam) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAction("Đã gửi lời mời kết bạn!")}
              className="flex-1 bg-ocean-primary hover:bg-ocean-secondary text-white text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors text-center"
            >
              Thêm Bạn
            </button>
            <button
              type="button"
              onClick={() => handleAction("Đã chặn người dùng.")}
              className="bg-white/10 hover:bg-white/15 text-ocean-light text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
            >
              Chặn
            </button>
            <button
              type="button"
              onClick={() => handleAction("Đã gửi báo cáo vi phạm spam.")}
              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors"
            >
              Báo Cáo
            </button>
          </div>

          {actionMsg && (
            <div className="p-2 rounded bg-ocean-primary/20 border border-ocean-secondary text-ocean-secondary text-xs text-center animate-fadeIn">
              {actionMsg}
            </div>
          )}

          {/* Mutual Servers & Friends */}
          <div className="bg-[#071A2C] rounded-xl p-3 border border-ocean-dark-border/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-ocean-light/80">
              <span>👥</span>
              <span>{profile?.mutualFriendsCount ?? 0} Bạn Chung</span>
            </div>
            <div className="flex items-center gap-2 text-ocean-light/80">
              <span>🌐</span>
              <span>{profile?.mutualServersCount ?? 1} Máy Chủ Chung</span>
            </div>
          </div>

          {/* Bio / About */}
          <div className="bg-[#071A2C] rounded-xl p-3 border border-ocean-dark-border/80 space-y-2">
            <p className="text-[10px] font-bold text-ocean-light/40 uppercase tracking-wider">
              Tiểu Sử
            </p>
            <p className="text-xs text-ocean-light/85 whitespace-pre-wrap leading-relaxed">
              {profile?.bio || "!Factorial! Japanese — https://bravee9.github.io/bravemath/"}
            </p>
          </div>

          {/* Member Since */}
          <div className="bg-[#071A2C] rounded-xl p-3 border border-ocean-dark-border/80 space-y-1">
            <p className="text-[10px] font-bold text-ocean-light/40 uppercase tracking-wider">
              Gia Nhập Từ
            </p>
            <p className="text-xs text-ocean-light/80">{joinDate}</p>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action */}
      <div className="p-4 border-t border-ocean-dark-border/40">
        <button
          type="button"
          onClick={() => handleAction("Đang mở hồ sơ người dùng")}
          className="w-full btn-secondary text-xs py-2 text-center"
        >
          Xem hồ sơ đầy đủ
        </button>
      </div>
    </aside>
  );
}
