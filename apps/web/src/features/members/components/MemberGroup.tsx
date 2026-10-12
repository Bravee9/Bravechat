"use client";

import React from "react";
import { MemberItem, type Member } from "./MemberItem";

interface MemberGroupProps {
  title: string;
  members: Member[];
}

export function MemberGroup({ title, members }: MemberGroupProps) {
  if (members.length === 0) return null;

  return (
    <div data-testid={`member-group-${title}`}>
      <h3 className="px-2 mb-1.5 text-ocean-light/50 text-[11px] font-extrabold uppercase tracking-wider select-none">
        {title} — {members.length}
      </h3>
      <div className="space-y-0.5">
        {members.map((member) => (
          <MemberItem key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
