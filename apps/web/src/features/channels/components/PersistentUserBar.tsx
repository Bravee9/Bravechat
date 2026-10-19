"use client";

import React from "react";
import { useCurrentUser } from "@/stores/workspace.store";
import { UserProfileBar } from "./UserProfileBar";

/**
 * Thanh profile thuộc Layer 1 (cố định): nổi ở góc dưới-trái, trải qua Server Rail + Sidebar
 * giống Discord. User không phụ thuộc server nên chỉ tải một lần và không remount khi đổi server.
 * Rộng = 72px (rail) + 240px (sidebar).
 */
export function PersistentUserBar() {
  const currentUser = useCurrentUser();

  return (
    <div className="absolute bottom-0 left-0 w-[312px] z-40 border-r border-ocean-dark-border">
      <UserProfileBar currentUser={currentUser} />
    </div>
  );
}
