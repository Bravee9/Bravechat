"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { http } from "@/services/http";
import { CloseIcon } from "@/components/ui/Icons";
import { useCurrentUser } from "@/stores/workspace.store";
import { useFriendshipRelation } from "@/features/members/useFriendshipRelation";

interface DmUserProfile {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  customStatus?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  status?: string;
}

interface DmUserProfileSidebarProps {
  userId: string;
  onClose?: () => void;
}

export function DmUserProfileSidebar({ userId, onClose }: DmUserProfileSidebarProps) {
  const currentUser = useCurrentUser();
  const [profile, setProfile] = useState<DmUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const {
    relation,
    busy,
    error: actionError,
    notice,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriendship,
    blockUser,
    unblockUser,
  } = useFriendshipRelation(currentUser?.id === userId ? undefined : userId);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    const fetchProfile = async () => {
      try {
        const res = await http.get<{ user: DmUserProfile }>(`/users/${encodeURIComponent(userId)}`);
        if (active) setProfile(res.user);
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Không thể tải hồ sơ người dùng.");
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

  if (loading) {
    return (
      <aside className="w-80 bg-[#18181B] border-l border-[#2B2D30] flex flex-col items-center justify-center p-6 text-xs text-[#7D7D7D] select-none flex-shrink-0">
        <div className="w-5 h-5 border-2 border-[#087CFA] border-t-transparent rounded-full animate-spin mb-2" />
        <span>Hồ sơ người dùng</span>
      </aside>
    );
  }

  if (!profile) {
    return (
      <aside
        className="w-80 bg-[#18181B] border-l border-[#2B2D30] flex flex-col items-center justify-center p-6 text-xs text-[#A8A8B0] text-center select-none flex-shrink-0 gap-3"
        data-testid="dm-user-profile-sidebar"
      >
        <p>{loadError || "Không tìm thấy hồ sơ người dùng."}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-[4px] border border-[#2B2D30] bg-[#1E1F22] hover:bg-[#2B2D30] text-xs text-white cursor-pointer"
          >
            Đóng
          </button>
        )}
      </aside>
    );
  }

  const isSelf = currentUser?.id === profile.id;
  const statusText =
    profile.status === "ONLINE"
      ? "Trực tuyến"
      : profile.status === "IDLE"
      ? "Chờ"
      : profile.status === "DO_NOT_DISTURB"
      ? "Không làm phiền"
      : "Ngoại tuyến";

  return (
    <aside
      className="w-80 bg-[#18181B] border-l border-[#2B2D30] flex flex-col justify-between overflow-y-auto select-none flex-shrink-0 z-10"
      data-testid="dm-user-profile-sidebar"
    >
      <div>
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-[#214283] via-[#087CFA]/40 to-[#141417] relative border-b border-[#2B2D30]">
          {profile.bannerUrl && (
            <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-[4px] bg-[#141417]/80 border border-[#2B2D30] text-[#A8A8B0] hover:text-white hover:bg-[#2B2D30] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng bảng hồ sơ"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Avatar & Status */}
        <div className="px-4 relative flex justify-between items-end -mt-10 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-[#18181B] bg-[#1E1F22] overflow-hidden flex items-center justify-center font-bold text-xl text-[#07C3F2]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile.displayName?.[0] || profile.username[0] || "U").toUpperCase()
              )}
            </div>
            <div
              className={cn(
                "absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#18181B]",
                profile.status === "ONLINE"
                  ? "bg-emerald-500"
                  : profile.status === "IDLE"
                  ? "bg-amber-500"
                  : profile.status === "DO_NOT_DISTURB"
                  ? "bg-rose-500"
                  : "bg-slate-500"
              )}
              title={statusText}
            />
          </div>

          <span className="px-2 py-1 rounded-[4px] bg-[#141417] border border-[#2B2D30] text-[10px] font-mono text-[#A8A8B0]">
            {statusText}
          </span>
        </div>

        {/* Profile Card Body */}
        <div className="px-4 space-y-3 pb-4">
          <div>
            <h3 className="font-bold text-base text-[#F2F2F3] leading-snug">
              {profile.displayName || profile.username}
            </h3>
            <p className="text-xs text-[#7D7D7D] font-mono">@{profile.username}</p>
            {profile.customStatus && (
              <p className="text-xs text-[#A8A8B0] mt-1">{profile.customStatus}</p>
            )}
          </div>

          {/* Real Friend / Block / Unblock Actions */}
          {!isSelf && (
            <div className="flex flex-wrap gap-2">
              {relation.kind === "blocked" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void unblockUser()}
                  data-testid="dm-unblock-btn"
                  className="flex-1 bg-[#1E1F22] hover:bg-[#2B2D30] border border-[#393B40] text-white text-xs font-semibold py-1.5 px-3 rounded-[4px] transition-colors text-center cursor-pointer disabled:opacity-50"
                >
                  {busy ? "Đang xử lý..." : "Bỏ chặn"}
                </button>
              ) : (
                <>
                  {relation.kind === "none" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void sendFriendRequest(profile.username)}
                      className="flex-1 bg-[#087CFA] hover:bg-[#3574F0] text-white text-xs font-semibold py-1.5 px-2.5 rounded-[4px] transition-colors text-center cursor-pointer disabled:opacity-50"
                    >
                      Thêm Bạn
                    </button>
                  )}
                  {relation.kind === "outgoing" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeFriendship("Đã hủy lời mời kết bạn.")}
                      className="flex-1 bg-[#1E1F22] hover:bg-[#2B2D30] border border-[#2B2D30] text-[#E6EDF3] text-xs font-semibold py-1.5 px-2.5 rounded-[4px] transition-colors text-center cursor-pointer disabled:opacity-50"
                    >
                      Hủy lời mời
                    </button>
                  )}
                  {relation.kind === "incoming" && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void acceptFriendRequest()}
                        className="flex-1 bg-[#087CFA] hover:bg-[#3574F0] text-white text-xs font-semibold py-1.5 px-2.5 rounded-[4px] transition-colors text-center cursor-pointer disabled:opacity-50"
                      >
                        Chấp nhận
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void rejectFriendRequest()}
                        className="bg-[#1E1F22] hover:bg-[#2B2D30] border border-[#2B2D30] text-[#E6EDF3] text-xs font-semibold py-1.5 px-2.5 rounded-[4px] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {relation.kind === "friends" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeFriendship("Đã hủy kết bạn.")}
                      className="flex-1 bg-[#1E1F22] hover:bg-[#2B2D30] border border-[#2B2D30] text-[#E6EDF3] text-xs font-semibold py-1.5 px-2.5 rounded-[4px] transition-colors text-center cursor-pointer disabled:opacity-50"
                    >
                      Hủy kết bạn
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void blockUser()}
                    data-testid="dm-block-btn"
                    className="bg-[#FE2857]/15 hover:bg-[#FE2857]/25 border border-[#FE2857]/30 text-[#FE2857] text-xs font-semibold py-1.5 px-3 rounded-[4px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Chặn
                  </button>
                </>
              )}
            </div>
          )}

          {actionError && (
            <div role="alert" className="p-2 rounded-[4px] bg-[#FE2857]/10 border border-[#FE2857]/40 text-[#FE2857] text-xs text-center">
              {actionError}
            </div>
          )}
          {notice && (
            <div role="status" className="p-2 rounded-[4px] bg-[#21D789]/10 border border-[#21D789]/40 text-[#21D789] text-xs text-center">
              {notice}
            </div>
          )}

          {/* Bio / About */}
          <div className="bg-[#141417] rounded-[6px] p-3 border border-[#2B2D30] space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-[#7D7D7D] uppercase tracking-wider">
              Giới thiệu
            </p>
            <p className="text-xs text-[#DFE1E5] whitespace-pre-wrap leading-relaxed">
              {profile.bio || "Người dùng chưa cập nhật phần giới thiệu."}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
