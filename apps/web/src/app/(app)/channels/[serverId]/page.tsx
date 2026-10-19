"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadServerDetail, workspaceStore } from "@/stores/workspace.store";

export default function ServerIndexPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = decodeURIComponent(params.serverId as string);

  useEffect(() => {
    let active = true;
    void loadServerDetail(serverId, true).then(() => {
      if (!active) return;
      const detail = workspaceStore.get().serverDetails[serverId];
      const firstChannel = detail?.channels.slice().sort((left, right) => left.position - right.position)[0];
      if (firstChannel) router.replace(`/channels/${encodeURIComponent(serverId)}/${encodeURIComponent(firstChannel.id)}`);
    });
    return () => { active = false; };
  }, [router, serverId]);

  return <div className="flex h-full flex-1 items-center justify-center text-sm text-ocean-light/60">Đang mở máy chủ...</div>;
}
