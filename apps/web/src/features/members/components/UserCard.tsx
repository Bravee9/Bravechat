"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DialogFrame } from "@/components/ui/DialogFrame";
import { http } from "@/services/http";
import { useCurrentUser } from "@/stores/workspace.store";
import { useFriendshipRelation } from "@/features/members/useFriendshipRelation";
import type { UserSummary } from "@discord-clone/shared";

export function UserCard({ userId, onClose }: { userId: string; onClose: () => void }) {
  const current = useCurrentUser();
  const [user, setUser] = useState<(UserSummary & { bio?: string | null; customStatus?: string | null }) | null>(null);
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
  } = useFriendshipRelation(current?.id === userId ? undefined : userId);

  useEffect(() => {
    let active = true;
    void http
      .get<{ user: UserSummary }>("/users/" + encodeURIComponent(userId))
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch((reason) => {
        if (active) setLoadError(reason instanceof Error ? reason.message : "Không thể tải hồ sơ.");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const error = loadError || actionError;

  return (
    <DialogFrame title="Hồ sơ người dùng" onClose={onClose}>
      {user ? (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">{user.displayName || user.username}</h3>
          <p className="text-sm text-ocean-light/60">@{user.username}</p>
          {user.bio && <p className="whitespace-pre-wrap text-sm">{user.bio}</p>}
          {user.customStatus && <p className="text-xs text-ocean-light/60">{user.customStatus}</p>}
          {user.id !== current?.id && (
            <div className="flex flex-wrap gap-2">
              <Link
                className="btn-primary"
                href={"/channels/@me/" + encodeURIComponent(user.id)}
                onClick={onClose}
              >
                Nhắn tin
              </Link>
              {relation.kind === "blocked" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => void unblockUser()}
                >
                  Bỏ chặn
                </button>
              ) : (
                <>
                  {relation.kind === "none" && (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => void sendFriendRequest(user.username)}
                    >
                      Kết bạn
                    </button>
                  )}
                  {relation.kind === "outgoing" && (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => void removeFriendship("Đã hủy lời mời kết bạn.")}
                    >
                      Hủy lời mời
                    </button>
                  )}
                  {relation.kind === "incoming" && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => void acceptFriendRequest()}
                      >
                        Chấp nhận
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => void rejectFriendRequest()}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {relation.kind === "friends" && (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => void removeFriendship("Đã hủy kết bạn.")}
                    >
                      Hủy kết bạn
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => void blockUser()}
                  >
                    Chặn
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        !error && <p role="status">Đang tải...</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      <button type="button" className="btn-secondary mt-5" onClick={onClose}>
        Đóng
      </button>
    </DialogFrame>
  );
}
