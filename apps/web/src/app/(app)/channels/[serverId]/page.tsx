"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadServerDetail, workspaceStore } from "@/stores/workspace.store";
import { ChatView } from "@/features/messages/components/ChatView";

export default function ServerIndexPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = decodeURIComponent(params.serverId as string);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serverId === "@me") return;
    let active = true;

    loadServerDetail(serverId, true)
      .then(() => {
        if (!active) return;
        const detail = workspaceStore.get().serverDetails[serverId];
        const firstChannel = detail?.channels.slice().sort((left, right) => left.position - right.position)[0];
        if (firstChannel) {
          router.replace(`/channels/${encodeURIComponent(serverId)}/${encodeURIComponent(firstChannel.id)}`);
        } else {
          setError("Máy chủ không có kênh nào hoặc bạn không có quyền truy cập.");
          setTimeout(() => {
            if (active) router.replace("/channels/@me");
          }, 1500);
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Không thể tải thông tin máy chủ hoặc bạn không phải thành viên.");
        setTimeout(() => {
          if (active) router.replace("/channels/@me");
        }, 1500);
      });

    return () => { active = false; };
  }, [router, serverId]);

  if (serverId === "@me") return <ChatView serverId="@me" channelId="friends" />;
  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 text-sm text-rose-300">
        <p>{error}</p>
        <p className="text-xs text-ocean-light/60">Đang chuyển hướng về trang cá nhân...</p>
      </div>
    );
  }
  return <div className="flex h-full flex-1 items-center justify-center text-sm text-ocean-light/60">Đang mở máy chủ...</div>;
}
