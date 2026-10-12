"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import type { ServerListItem } from "@discord-clone/shared";
import { serverService } from "@/services/server.service";
import { HomeRailItem } from "./HomeRailItem";
import { ServerRailItem } from "./ServerRailItem";
import { RailActionItem } from "./RailActionItem";
import { RailSeparator } from "./RailSeparator";

export function ServerRail() {
  const pathname = usePathname();
  const params = useParams();

  const rawServerId = (params?.serverId as string) || pathname.split("/")[2] || "@me";
  const currentServerId = decodeURIComponent(rawServerId);
  const isHomeActive = currentServerId === "@me";

  const [servers, setServers] = useState<ServerListItem[]>([]);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    serverService.getMyServers().then((list) => {
      if (isMounted) setServers(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <nav
      aria-label="Danh sách máy chủ"
      className="w-[72px] bg-[#030a0d] border-r border-ocean-dark-border flex flex-col items-center py-3 gap-2 flex-shrink-0 z-30 select-none"
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
            isHovered={hoveredItemId === server.id}
            onHover={(hovered) => setHoveredItemId(hovered ? server.id : null)}
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
          onClick={() => alert("Chức năng tạo máy chủ: đang kết nối với POST /api/servers")}
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

export const ServerSidebar = ServerRail;
