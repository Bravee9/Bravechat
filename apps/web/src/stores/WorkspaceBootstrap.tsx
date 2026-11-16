"use client";

import { useEffect } from "react";
import { loadConversations, loadCurrentUser, loadServers } from "./workspace.store";
import { workspaceStore } from "./workspace.store";
import { useStore } from "@/lib/store";

/** Tải dữ liệu nền tảng một lần khi vào /channels (tương đương READY của Discord). */
export function WorkspaceBootstrap() {
  const error = useStore(workspaceStore, (state) => state.error);
  useEffect(() => {
    void loadCurrentUser();
    void loadServers();
    void loadConversations();
  }, []);
  return error ? <p role="alert" className="absolute right-0 top-0 z-50 bg-rose-950 px-3 py-2 text-xs text-rose-200">{error}</p> : null;
}
