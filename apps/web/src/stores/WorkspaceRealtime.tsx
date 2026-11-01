"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { env } from "@/config/env";
import { ApiError, http } from "@/services/http";
import { applyChannelActivity, loadConversations, loadCurrentUser, loadServerDetail, loadServers, markChannelRead, useCurrentUser, useServers } from "./workspace.store";
export function WorkspaceRealtime() {
  const servers = useServers(); const user = useCurrentUser(); const pathname = usePathname();
  const pathRef = useRef(pathname); pathRef.current = pathname;
  const serverIds = servers.map((item) => item.id).sort().join("|");
  useEffect(() => {
    // Một socket cho workspace nhận sự kiện cá nhân và activity của mọi server đã tham gia.
    if (!user || env.useMocks) return;
    let active = true; let socket: WebSocket; let retry: ReturnType<typeof setTimeout>; let attempts = 0;
    const dispatch = (event: unknown) => window.dispatchEvent(new CustomEvent("bravechat:realtime", { detail: event }));
    const connect = () => {
      if (!active) return;
      dispatch({ type: "connection", status: "connecting" });
      socket = new WebSocket(env.wsUrl);
      socket.onopen = () => {
        attempts = 0;
        for (const serverId of serverIds.split("|").filter(Boolean)) socket.send(JSON.stringify({ type: "join_server", serverId }));
        dispatch({ type: "ready" }); dispatch({ type: "connection", status: "connected" });
        void loadConversations(true);
        void loadServers(true);
      };
      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data); dispatch(data);
          if (data.type?.startsWith("dm_") || data.type === "conversations_update" || data.type === "friends_update") void loadConversations(true);
          if (data.type === "user_update") void loadCurrentUser(true);
          if (data.type === "channel_read") {
            // ACK từ thiết bị khác cũng làm mới badge lấy từ DB, không chỉ state của tab này.
            markChannelRead(data.serverId, data.channelId);
            void loadServers(true);
            void loadServerDetail(data.serverId, true);
          }
          if (data.type !== "message_create" || !data.serverId || data.message?.author?.id === user.id) return;
          const parts = pathRef.current.split("/").filter(Boolean).map(decodeURIComponent);
          if (parts[1] === data.serverId && parts[2] === data.channelKey && document.visibilityState === "visible") return;
          const content = String(data.message?.content ?? "").toLowerCase();
          const mention = [user.username, user.displayName].some((name) => name && content.includes("@" + name.toLowerCase()));
          applyChannelActivity(data.serverId, data.channelKey, mention);
        } catch { /* Ignore malformed frames; state is recovered on reconnect. */ }
      };
      socket.onclose = () => {
        if (!active) return;
        dispatch({ type: "connection", status: "disconnected" });
        retry = setTimeout(() => {
          void http.get("/auth/me").then(() => { if (active) connect(); }).catch((reason) => {
            if (!active) return;
            if (reason instanceof ApiError && reason.status === 401) window.location.replace("/login");
            else retry = setTimeout(connect, 5000);
          });
        }, Math.min(1000 * 2 ** attempts++, 15000));
      };
    };
    connect();
    return () => { active = false; clearTimeout(retry); socket?.close(); };
  }, [serverIds, user?.id, user?.username, user?.displayName]);
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (!parts[1] || !parts[2] || parts[1] === "@me") return;
    void loadServerDetail(parts[1]);
  }, [pathname]);
  return null;
}
