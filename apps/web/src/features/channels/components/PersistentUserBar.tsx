"use client";

import React from "react";
import { useCurrentUser } from "@/stores/workspace.store";
import { UserProfileBar } from "./UserProfileBar";

/**
 * Thanh profile thuộc Layer 1 (cố định), nằm dưới danh sách kênh.
 * giống Discord. User không phụ thuộc server nên chỉ tải một lần và không remount khi đổi server.
 * Chừa rail 72px bên trái; rộng bằng sidebar 240px.
 */
export function PersistentUserBar() {
  const currentUser = useCurrentUser();

  return (
    <div className="profile-dock absolute bottom-0 left-0 w-[312px] z-40 border-r border-ocean-dark-border">
      <UserProfileBar currentUser={currentUser} />
    </div>
  );
}
