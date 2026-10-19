"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useServerDetail } from "@/stores/workspace.store";
import { ServerHeader } from "./ServerHeader";
import { CategorySection } from "./CategorySection";

/**
 * LAYER 2 (nhánh server) — Danh sách kênh theo category.
 * Đọc từ store (stale-while-revalidate): quay lại server đã xem thì hiển thị ngay,
 * không nhấp nháy "Đang tải".
 */
export function ServerChannelSidebar({ serverId }: { serverId: string }) {
  const params = useParams();
  const currentChannelId = (params?.channelId as string) || "general";

  const serverDetail = useServerDetail(serverId);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);

  // Nhóm kênh theo category một lần (O(n)) thay vì filter lặp cho từng category.
  const channelsByCategory = useMemo(() => {
    const map = new Map<string, NonNullable<typeof serverDetail>["channels"]>();
    for (const channel of serverDetail?.channels ?? []) {
      const key = channel.categoryId ?? "";
      const list = map.get(key);
      if (list) list.push(channel);
      else map.set(key, [channel]);
    }
    return map;
  }, [serverDetail]);

  return (
    <aside
      aria-label="Danh sách kênh"
      className="w-60 bg-ocean-dark-surface border-r border-ocean-dark-border flex flex-col flex-shrink-0 h-full select-none"
      data-testid="channel-sidebar"
    >
      <ServerHeader
        serverName={serverDetail?.name || "Đang tải server..."}
        isMe={false}
        isOpen={isServerMenuOpen}
        onToggle={() => setIsServerMenuOpen((prev) => !prev)}
        onClose={() => setIsServerMenuOpen(false)}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-16 px-2 custom-scrollbar space-y-4">
        {serverDetail?.categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            channels={channelsByCategory.get(category.id) ?? []}
            serverId={serverId}
            currentChannelId={currentChannelId}
          />
        ))}
      </div>
    </aside>
  );
}
