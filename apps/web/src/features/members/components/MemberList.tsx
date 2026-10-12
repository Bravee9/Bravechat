"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "BOT";
  status: "ONLINE" | "IDLE" | "DND" | "OFFLINE";
  customStatus?: string;
}

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
    >
      <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-4">
        {/* Nhóm trực tuyến */}
        <div>
          <h3 className="px-2 mb-1.5 text-ocean-light/50 text-[11px] font-extrabold uppercase tracking-wider">
            Trực tuyến — {onlineMembers.length}
          </h3>
          <div className="space-y-0.5">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-ocean-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {member.name[0]}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#051424]",
                      member.status === "ONLINE" && "bg-emerald-500",
                      member.status === "IDLE" && "bg-amber-500",
                      member.status === "DND" && "bg-rose-500"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-xs font-bold truncate",
                        member.role === "OWNER" && "text-amber-400",
                        member.role === "ADMIN" && "text-ocean-secondary",
                        member.role === "BOT" && "text-indigo-400",
                        member.role === "MEMBER" && "text-ocean-light"
                      )}
                    >
                      {member.name}
                    </span>
                    {member.role === "BOT" && (
                      <span className="bg-ocean-primary text-white text-[9px] font-extrabold px-1 py-0.2 rounded uppercase">
                        BOT
                      </span>
                    )}
                  </div>
                  {member.customStatus && (
                    <p className="text-[10px] text-ocean-light/40 truncate">
                      {member.customStatus}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nhóm ngoại tuyến */}
        {offlineMembers.length > 0 && (
          <div>
            <h3 className="px-2 mb-1.5 text-ocean-light/50 text-[11px] font-extrabold uppercase tracking-wider">
              Ngoại tuyến — {offlineMembers.length}
            </h3>
            <div className="space-y-0.5">
              {offlineMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer opacity-60 hover:opacity-100"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-ocean-dark-surface border border-ocean-dark-border flex items-center justify-center text-ocean-light/60 text-xs font-bold">
                      {member.name[0]}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#051424] bg-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ocean-light/70 truncate">
                      {member.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
