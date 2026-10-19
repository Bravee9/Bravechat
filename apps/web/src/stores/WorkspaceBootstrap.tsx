"use client";

import { useEffect } from "react";
import { loadConversations, loadCurrentUser, loadServers } from "./workspace.store";

/** Tải dữ liệu nền tảng một lần khi vào /channels (tương đương READY của Discord). */
export function WorkspaceBootstrap() {
  useEffect(() => {
    void loadCurrentUser();
    void loadServers();
    void loadConversations();
  }, []);
  return null;
}
