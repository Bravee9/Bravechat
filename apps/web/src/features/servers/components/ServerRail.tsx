"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { loadServers, useServers } from "@/stores/workspace.store";
import { HomeRailItem } from "./HomeRailItem";
import { ServerRailItem } from "./ServerRailItem";
import { RailActionItem } from "./RailActionItem";
import { RailSeparator } from "./RailSeparator";
import { http } from "@/services/http";
import type { ServerDetail } from "@discord-clone/shared";
import { env } from "@/config/env";
import { API_ROUTES } from "@discord-clone/shared";
import { DialogFrame } from "@/components/ui/DialogFrame";

const RAIL_SCROLL_KEY = "bravechat:server-rail-scroll";
let savedRailScrollTop = 0;

export function ServerRail() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const rawServerId =
    (params?.serverId as string) || pathname.split("/")[2] || "@me";
  const currentServerId = decodeURIComponent(rawServerId);
  const isHomeActive = currentServerId === "@me";

  // Dữ liệu từ store dùng chung: tải một lần, không refetch khi đổi server.
  const servers = useServers();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Giữ cố định vị trí cuộn của thanh server khi chuyển đổi qua lại giữa các server.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    try {
      const persisted = sessionStorage.getItem(RAIL_SCROLL_KEY);
      if (persisted !== null) {
        savedRailScrollTop = Number(persisted) || 0;
      }
    } catch {
      // ignore storage errors
    }
    if (savedRailScrollTop > 0) {
      el.scrollTop = savedRailScrollTop;
    }
  }, [currentServerId, servers.length]);

  const handleRailScroll = (e: React.UIEvent<HTMLDivElement>) => {
    savedRailScrollTop = e.currentTarget.scrollTop;
    try {
      sessionStorage.setItem(RAIL_SCROLL_KEY, String(savedRailScrollTop));
    } catch {
      // ignore storage errors
    }
  };

  const [dialogMode, setDialogMode] = useState<"create" | "join" | null>(null);
  const [serverName, setServerName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleServerAction = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionError("");
    if (env.useMocks) {
      setActionError(
        "Tắt chế độ mock để dùng chức năng server với dữ liệu thật."
      );
      return;
    }
    setIsSubmitting(true);
    try {
      if (dialogMode === "create") {
        const result = await http.post<{ server: ServerDetail }>(
          API_ROUTES.servers.create,
          { name: serverName.trim() }
        );
        await loadServers(true);
        setDialogMode(null);
        setServerName("");
        router.push(`/channels/${encodeURIComponent(result.server.id)}`, {
          scroll: false,
        });
      } else {
        const result = await http.post<{ serverId: string }>(
          API_ROUTES.invites.join(inviteCode.trim())
        );
        await loadServers(true);
        setDialogMode(null);
        setInviteCode("");
        router.push(`/channels/${encodeURIComponent(result.serverId)}`, {
          scroll: false,
        });
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Không thể hoàn tất thao tác server."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  return (
    <nav
      aria-label="Danh sách máy chủ"
      className="w-[72px] bg-[#141417] border-r border-[#2B2D30] flex flex-col items-center pt-3 pb-3 gap-2 flex-shrink-0 z-30 select-none"
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

      {/* 3. Danh sách máy chủ cuộn dọc — giữ nguyên scrollTop khi chuyển server */}
      <div
        ref={scrollContainerRef}
        onScroll={handleRailScroll}
        data-testid="server-rail-scroll"
        className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 custom-scrollbar pr-0.5"
      >
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
          onClick={() => {
            setActionError("");
            setDialogMode("create");
          }}
        >
          <svg
            className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </RailActionItem>

        {/* 5. Nút Tham gia máy chủ qua mã mời */}
        <RailActionItem
          id="explore"
          tooltip="Tham gia máy chủ bằng mã mời"
          ariaLabel="Khám phá máy chủ"
          variant="ocean"
          isHovered={hoveredItemId === "explore"}
          onHover={(hovered) => setHoveredItemId(hovered ? "explore" : null)}
          onClick={() => {
            setActionError("");
            setDialogMode("join");
          }}
        >
          <svg
            className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
              fill="currentColor"
            />
          </svg>
        </RailActionItem>
      </div>

      {dialogMode ? (
        <DialogFrame
          title={dialogMode === "create" ? "Tạo máy chủ" : "Tham gia máy chủ"}
          description={
            dialogMode === "create"
              ? "Máy chủ mới sẽ được tạo cùng các kênh mặc định."
              : "Nhập mã mời để tham gia máy chủ."
          }
          onClose={() => setDialogMode(null)}
        >
          <form onSubmit={handleServerAction} className="space-y-4">
            <label
              className="block text-sm font-medium"
              htmlFor="server-workflow-input"
            >
              {dialogMode === "create" ? "Tên máy chủ" : "Mã mời"}
            </label>
            <input
              id="server-workflow-input"
              autoFocus
              required
              minLength={dialogMode === "create" ? 2 : 1}
              maxLength={dialogMode === "create" ? 100 : 128}
              value={dialogMode === "create" ? serverName : inviteCode}
              onChange={(event) =>
                dialogMode === "create"
                  ? setServerName(event.target.value)
                  : setInviteCode(event.target.value)
              }
              className="input-ocean w-full"
            />
            {actionError ? (
              <p role="alert" className="text-sm text-rose-300">
                {actionError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDialogMode(null)}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-60"
              >
                {isSubmitting
                  ? "Đang xử lý…"
                  : dialogMode === "create"
                  ? "Tạo máy chủ"
                  : "Tham gia"}
              </button>
            </div>
          </form>
        </DialogFrame>
      ) : null}
    </nav>
  );
}
