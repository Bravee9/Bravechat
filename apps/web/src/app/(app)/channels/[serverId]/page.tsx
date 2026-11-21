"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  loadServerDetail,
  useServerDetail,
  workspaceStore,
} from "@/stores/workspace.store";
import { ChatView } from "@/features/messages/components/ChatView";
import { MemberList } from "@/features/members/components/MemberList";
import { LockIcon } from "@/components/ui/Icons";

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
    loadServerDetail(serverId)
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
          <div className="w-10 h-10 rounded-[6px] bg-[#FE2857]/15 border border-[#FE2857]/40 text-[#FE2857] flex items-center justify-center mx-auto">
            <LockIcon className="w-5 h-5" />
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
    <div className="flex-1 flex min-w-0 h-full overflow-hidden bg-[#1E1F22]">
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-[44px] border-b border-[#2B2D30] px-4 flex items-center justify-between flex-shrink-0 bg-[#1E1F22]">
          <div className="h-6 w-28 rounded-[4px] bg-[#2B2D30]/60" />
          <div className="h-6 w-20 rounded-[4px] bg-[#141417] border border-[#2B2D30]" />
        </header>
        <div className="flex-1 px-4 pt-4">
          <div className="h-20 rounded-[6px] bg-[#18181B] border border-[#2B2D30]" />
        </div>
        <div className="px-4 pb-3">
          <div className="h-[42px] rounded-[6px] bg-[#141417] border border-[#393B40]" />
        </div>
      </main>
      <MemberList isVisible={true} serverId={serverId} />
    </div>
  );
}
