"use client";

import React, { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useServers } from "@/stores/workspace.store";
import { HomeRailItem } from "./HomeRailItem";
import { ServerRailItem } from "./ServerRailItem";
import { RailActionItem } from "./RailActionItem";
import { RailSeparator } from "./RailSeparator";
import { useRouter } from "next/navigation";
import { http } from "@/services/http";
import { loadServers } from "@/stores/workspace.store";
import type { ServerDetail } from "@discord-clone/shared";
import { env } from "@/config/env";

export function ServerRail() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const rawServerId = (params?.serverId as string) || pathname.split("/")[2] || "@me";
  const currentServerId = decodeURIComponent(rawServerId);
  const isHomeActive = currentServerId === "@me";

  // Dữ liệu từ store dùng chung: tải một lần, không refetch khi đổi server.
  const servers = useServers();

  const handleCreateServer = async () => {
    const name = window.prompt("Tên máy chủ mới:")?.trim();
    if (!name) return;
    if (env.useMocks) {
      window.alert("Tắt chế độ mock để tạo server và dùng dữ liệu thật.");
      return;
    }
    try {
      const result = await http.post<{ server: ServerDetail }>("/servers", { name });
      await loadServers(true);
      router.push(`/channels/${encodeURIComponent(result.server.id)}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể tạo server.");
    }
  };
  // Chỉ dành cho Home / nút hành động. Server items tự quản hover để không re-render cả danh sách.
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  return (
    <nav
      aria-label="Danh sách máy chủ"
      className="w-[72px] bg-[#030a0d] border-r border-ocean-dark-border flex flex-col items-center pt-3 pb-16 gap-2 flex-shrink-0 z-30 select-none"
      data-testid="server-rail"
    >
      {/* 1. Nút Trang chủ / Direct Messages (@me) */}
      <HomeRailItem
        isActive={isHomeActive}
        isHovered={hoveredItemId === "@me"}
        onHover={(hovered) => setHoveredItemId(hovered ? "@me" : null)}
      />

      {/* 2. Đường phân cách */}
      <RailSeparator />

      {/* 3. Danh sách máy chủ cuộn dọc */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 custom-scrollbar pr-0.5">
        {servers.map((server) => (
          <ServerRailItem
            key={server.id}
            server={server}
            isActive={currentServerId === server.id}
          />
        ))}

        {/* 4. Nút Thêm máy chủ mới (+) */}
        <RailActionItem
          id="add"
          tooltip="Thêm máy chủ mới"
          ariaLabel="Tạo máy chủ"
          variant="emerald"
          isHovered={hoveredItemId === "add"}
          onHover={(hovered) => setHoveredItemId(hovered ? "add" : null)}
          onClick={() => void handleCreateServer()}
        >
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </RailActionItem>

        {/* 5. Nút Khám phá máy chủ cộng đồng (Compass) */}
        <RailActionItem
          id="explore"
          tooltip="Khám phá máy chủ cộng đồng"
          ariaLabel="Khám phá máy chủ"
          variant="ocean"
          isHovered={hoveredItemId === "explore"}
          onHover={(hovered) => setHoveredItemId(hovered ? "explore" : null)}
        >
          <svg
            className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
          </svg>
        </RailActionItem>
      </div>
    </nav>
  );
}
