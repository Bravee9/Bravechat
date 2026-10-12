"use client";

import React from "react";
import { MemberGroup } from "./MemberGroup";
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
  if (!isVisible) return null;

  const onlineMembers = MOCK_MEMBERS.filter((m) => m.status !== "OFFLINE");
  const offlineMembers = MOCK_MEMBERS.filter((m) => m.status === "OFFLINE");

  return (
    <aside
      aria-label="Danh sách thành viên"
      className="w-60 bg-[#051424] border-l border-ocean-dark-border flex flex-col h-full select-none flex-shrink-0 animate-fade-in"
      data-testid="member-list"
    >
      <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-4">
        {/* 1. Nhóm trực tuyến */}
        <MemberGroup title="Trực tuyến" members={onlineMembers} />

        {/* 2. Nhóm ngoại tuyến */}
        <MemberGroup title="Ngoại tuyến" members={offlineMembers} />
      </div>
    </aside>
  );
}
