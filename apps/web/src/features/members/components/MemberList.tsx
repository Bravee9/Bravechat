"use client";

import React, { useEffect, useState } from "react";
import { MemberItem } from "./MemberItem";
import type { Member } from "./MemberItem";
import { serverService } from "@/services/server.service";

export function MemberList({ isVisible, serverId }: { isVisible: boolean; serverId?: string }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadError, setLoadError] = useState("");

  // Member list is fetched independently from server READY. Refresh periodically
  // so account status changes in another session show up without a full reload.
  useEffect(() => {
    if (!isVisible || !serverId) return;
    let active = true;
    const load = async () => {
      try {
        const rows = await serverService.getServerMembers(serverId);
        if (!active) return;
        setMembers(rows.map((row) => ({
          id: row.id,
          name: row.displayName || row.username,
          role: row.role,
          status: row.status,
          customStatus: row.customStatus ?? undefined,
          avatarUrl: row.avatarUrl,
        })));
        setLoadError("");
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Không tải được thành viên.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isVisible, serverId]);

  const onlineMembers = members.filter((m) => !["OFFLINE", "INVISIBLE"].includes(m.status));
  const offlineMembers = members.filter((m) => ["OFFLINE", "INVISIBLE"].includes(m.status));
  const rows = [
    { type: "header" as const, title: "Trực tuyến", count: onlineMembers.length },
    ...onlineMembers.map((member) => ({ type: "member" as const, member })),
    { type: "header" as const, title: "Ngoại tuyến", count: offlineMembers.length },
    ...offlineMembers.map((member) => ({ type: "member" as const, member })),
  ];
  const offsets: number[] = [];
  let totalHeight = 0;
  for (const row of rows) {
    offsets.push(totalHeight);
    totalHeight += row.type === "header" ? 26 : 56;
  }
  const firstVisible = Math.max(0, offsets.findIndex((offset, index) => offset + (rows[index].type === "header" ? 26 : 56) >= scrollTop - 300));
  const visibleEnd = scrollTop + viewportHeight + 300;
  const visibleRows = rows.map((row, index) => ({ row, index })).filter(({ index }) => offsets[index] <= visibleEnd && index >= firstVisible);
  if (!isVisible) return null;

  return (
    <aside
      aria-label="Danh sách thành viên"
      className="w-60 bg-[#051424] border-l border-ocean-dark-border flex flex-col h-full select-none flex-shrink-0 animate-fade-in"
      data-testid="member-list"
    >
      {loadError ? <p role="alert" className="px-4 py-3 text-xs text-rose-300">{loadError}</p> : null}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar"
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop);
          setViewportHeight(event.currentTarget.clientHeight);
        }}
      >
        <div className="relative" style={{ height: totalHeight }}>
          {visibleRows.map(({ row, index }) => (
            <div key={row.type === "header" ? row.title : row.member.id} className="absolute left-0 right-0" style={{ top: offsets[index], height: row.type === "header" ? 26 : 56 }}>
              {row.type === "header" ? (
                <h3 className="px-2 mb-1.5 text-ocean-light/50 text-[11px] font-extrabold uppercase tracking-wider select-none" data-testid={`member-group-${row.title}`}>
                  {row.title} — {row.count}
                </h3>
              ) : <MemberItem member={row.member} />}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
