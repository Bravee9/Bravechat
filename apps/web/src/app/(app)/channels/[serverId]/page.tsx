"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  loadServerDetail,
  useServerDetail,
  workspaceStore,
} from "@/stores/workspace.store";
import { ChatView } from "@/features/messages/components/ChatView";

export default function ServerIndexPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = decodeURIComponent(params.serverId as string);
  const detail = useServerDetail(serverId === "@me" ? "" : serverId);
  const [error, setError] = useState<string | null>(null);

  const firstChannel = (detail?.channels ?? [])
    .slice()
    .sort((left, right) => left.position - right.position)[0];

  useEffect(() => {
    if (serverId === "@me") return;
    if (firstChannel) {
      router.replace(
        `/channels/${encodeURIComponent(serverId)}/${encodeURIComponent(
          firstChannel.id
        )}`,
        { scroll: false }
      );
      return;
    }
    let active = true;
    loadServerDetail(serverId, true)
      .then(() => {
        if (!active) return;
        const fresh = workspaceStore.get().serverDetails[serverId];
        const ch = (fresh?.channels ?? [])
          .slice()
          .sort((left, right) => left.position - right.position)[0];
        if (ch) {
          router.replace(
            `/channels/${encodeURIComponent(serverId)}/${encodeURIComponent(
              ch.id
            )}`,
            { scroll: false }
          );
        } else {
          setError(
            "Máy chủ không có kênh nào hoặc bạn không có quyền truy cập."
          );
        }
      })
      .catch(() => {
        if (!active) return;
        setError(
          "Không thể tải thông tin máy chủ hoặc bạn không phải thành viên."
        );
      });

    return () => {
      active = false;
    };
  }, [router, serverId, firstChannel]);

  if (serverId === "@me")
    return <ChatView serverId="@me" channelId="friends" />;

  if (firstChannel) {
    return <ChatView serverId={serverId} channelId={firstChannel.id} />;
  }

  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 bg-[#1E1F22] p-6 text-center">
        <div className="max-w-md rounded-[6px] border border-[#2B2D30] bg-[#18181B] p-6 space-y-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#FE2857]/15 border border-[#FE2857]/40 text-[#FE2857] flex items-center justify-center mx-auto font-mono">
            🔒
          </div>
          <p className="text-sm font-bold text-white">{error}</p>
          <p className="text-xs text-[#A8A8B0]">
            Liên kết máy chủ này được bảo vệ hoặc yêu cầu mã mời hợp lệ để tham gia.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/channels/@me")}
            className="mt-2 px-4 py-2 rounded-[4px] bg-[#087CFA] text-white text-xs font-semibold hover:bg-[#07C3F2] hover:text-[#0B0B0D] transition-colors cursor-pointer"
          >
            Quay về Trang cá nhân (@me)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 items-center justify-center bg-[#1E1F22] text-xs font-mono text-[#7D7D7D]">
      Đang mở không gian làm việc...
    </div>
  );
}
