"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { loadConversations, useConversations } from "@/stores/workspace.store";
import { ServerHeader } from "./ServerHeader";
import { DirectMessageItem } from "./DirectMessageItem";
import { cn } from "@/lib/utils";
import { http } from "@/services/http";

/**
 * LAYER 2 (nhánh @me) — Danh sách Bạn bè & Tin nhắn trực tiếp.
 * Đọc từ store, không tự fetch.
 */
export function DmSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const conversations = useConversations();
  const router = useRouter();

  const currentDmId = (params?.dmId as string) || "";
  const isFriendsActive = pathname === "/channels/@me" || pathname === "/channels/%40me";

  async function startConversation() {
    const username = window.prompt("Nhập tên người dùng cần nhắn:")?.trim();
    if (!username) return;
    try {
      const { users } = await http.get<{ users: Array<{ id: string; username: string }> }>("/users/search", { query: { username } });
      const recipient = users.find((user) => user.username === username.toLowerCase()) ?? users[0];
      if (!recipient) { window.alert("Không tìm thấy người dùng."); return; }
      await loadConversations(true);
      router.push(`/channels/@me/${encodeURIComponent(recipient.id)}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể bắt đầu cuộc trò chuyện.");
    }
  }

  return (
    <aside
      aria-label="Danh sách tin nhắn trực tiếp"
      className="w-60 bg-ocean-dark-surface border-r border-ocean-dark-border flex flex-col flex-shrink-0 h-full select-none"
      data-testid="channel-sidebar"
    >
      <ServerHeader
        serverName=""
        isMe
        isOpen={false}
        onToggle={() => undefined}
        onClose={() => undefined}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 pb-16 px-2 custom-scrollbar space-y-4">
        <Link
          href="/channels/@me"
          data-testid="friends-tab-btn"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded transition-colors cursor-pointer group text-sm font-semibold",
            isFriendsActive
              ? "bg-ocean-primary/20 text-ocean-light border border-ocean-primary/30"
              : "text-ocean-light/70 hover:bg-white/5 hover:text-ocean-light"
          )}
        >
          <svg className="w-5 h-5 text-ocean-secondary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span>Bạn bè</span>
        </Link>

        <div className="pt-2">
          <div className="flex items-center justify-between px-2 mb-1.5 text-ocean-light/50 text-[11px] font-bold uppercase tracking-wider">
            <span>Tin nhắn trực tiếp</span>
            <button type="button" onClick={() => void startConversation()}
              className="text-sm cursor-pointer hover:text-ocean-light"
              title="Bắt đầu cuộc trò chuyện mới"
            >
              +
            </button>
          </div>

          {conversations.map((dm) => (
            <DirectMessageItem key={dm.id} conversation={dm} isActive={currentDmId === dm.id} />
          ))}
        </div>
      </div>
    </aside>
  );
}
