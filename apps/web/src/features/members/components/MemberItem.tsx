"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Member {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "BOT";
  status: "ONLINE" | "IDLE" | "DND" | "DO_NOT_DISTURB" | "INVISIBLE" | "OFFLINE";
  customStatus?: string;
  avatarUrl?: string | null;
}

interface MemberItemProps {
  member: Member;
}

export function MemberItem({ member }: MemberItemProps) {
  const isOffline = member.status === "OFFLINE" || member.status === "INVISIBLE";
  const presence = member.status === "DO_NOT_DISTURB" ? "DND" : member.status;

  return (
    <div
      data-testid={`member-item-${member.id}`}
      className={cn(
        "flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer group",
        isOffline && "opacity-60 hover:opacity-100"
      )}
    >
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm select-none",
            isOffline
              ? "bg-ocean-dark-surface border border-ocean-dark-border text-ocean-light/60"
              : "bg-ocean-primary text-white"
          )}
        >
          {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : member.name[0]}
        </div>
        <span
          data-testid={`member-presence-${member.status}`}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#051424]",
            presence === "ONLINE" && "bg-emerald-500",
            presence === "IDLE" && "bg-amber-500",
            presence === "DND" && "bg-rose-500",
            (presence === "OFFLINE" || presence === "INVISIBLE") && "bg-slate-500"
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
              member.role === "MEMBER" && (isOffline ? "text-ocean-light/70 font-medium" : "text-ocean-light")
            )}
          >
            {member.name}
          </span>
          {member.role === "BOT" && (
            <span
              data-testid="bot-badge"
              className="bg-ocean-primary text-white text-[9px] font-extrabold px-1 py-0.2 rounded uppercase select-none"
            >
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
  );
}
