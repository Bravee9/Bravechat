"use client";

import React, { useState } from "react";
import { MemberItem } from "./MemberItem";
import type { Member } from "./MemberItem";

const MOCK_MEMBERS: Member[] = [
  { id: "m1", name: "Bravee9", role: "OWNER", status: "ONLINE", customStatus: "Code with passion" },
  { id: "m2", name: "Shuji", role: "ADMIN", status: "ONLINE", customStatus: "Reviewing pull requests" },
  { id: "m3", name: "Antigravity AI", role: "BOT", status: "ONLINE", customStatus: "Pair programming" },
  { id: "m4", name: "Châu UI/UX", role: "MEMBER", status: "IDLE", customStatus: "Sketching wireframes" },
  { id: "m5", name: "Hải Nam", role: "MEMBER", status: "DND" },
  { id: "m6", name: "Thành Đạt", role: "MEMBER", status: "OFFLINE" },
];

export function MemberList({ isVisible }: { isVisible: boolean }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const onlineMembers = MOCK_MEMBERS.filter((m) => m.status !== "OFFLINE");
  const offlineMembers = MOCK_MEMBERS.filter((m) => m.status === "OFFLINE");
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
