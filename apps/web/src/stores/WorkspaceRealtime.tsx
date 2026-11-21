"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { env } from "@/config/env";
import { ApiError, http } from "@/services/http";
import {
  applyChannelActivity,
  loadConversations,
  loadCurrentUser,
  loadServerDetail,
  loadServers,
  markChannelRead,
  useCurrentUser,
  useServers,
} from "./workspace.store";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

let activeRealtimeMounted = false;
let sharedSocket: WebSocket | null = null;
let sharedStatus: ConnectionStatus = "connecting";
let activeChannelId: string | null = null;
let reconnectTrigger: (() => void) | null = null;

export function hasActiveWorkspaceRealtime(): boolean {
  return activeRealtimeMounted;
}

export function getSharedRealtimeStatus(): ConnectionStatus {
  return sharedStatus;
}

export function sendWorkspaceRealtimeFrame(payload: Record<string, unknown>): boolean {
  if (sharedSocket && sharedSocket.readyState === 1) {
    sharedSocket.send(JSON.stringify(payload));
    return true;
  }
  return false;
}

export function joinWorkspaceRealtimeChannel(channelId: string) {
  activeChannelId = channelId;
  sendWorkspaceRealtimeFrame({ type: "join_channel", channelId });
}

export function leaveWorkspaceRealtimeChannel(channelId: string) {
  if (activeChannelId === channelId) {
    activeChannelId = null;
  }
  sendWorkspaceRealtimeFrame({ type: "leave_channel", channelId });
}

export function reconnectWorkspaceRealtime() {
  reconnectTrigger?.();
}

export function WorkspaceRealtime() {
  const servers = useServers();
  const user = useCurrentUser();
  const pathname = usePathname();
  const userId = user?.id;
  const username = user?.username;
  const displayName = user?.displayName;
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const serverIds = servers.map((item) => item.id).sort().join("|");

  useEffect(() => {
    // Một socket duy nhất (Multiplexed Gateway) cho toàn bộ workspace:
    // nhận sự kiện cá nhân, activity của mọi server đã tham gia, và sự kiện kênh đang mở.
    if (!userId || env.useMocks) return;
    activeRealtimeMounted = true;
    let active = true;
    let socket: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let attempts = 0;
    let pendingServers: string[] = [];

    const joinNextServer = () => {
      const serverId = pendingServers.shift();
      if (serverId) socket.send(JSON.stringify({ type: "join_server", serverId }));
    };
    const dispatch = (event: unknown) =>
      window.dispatchEvent(new CustomEvent("bravechat:realtime", { detail: event }));
    const setStatus = (next: ConnectionStatus) => {
      sharedStatus = next;
      dispatch({ type: "connection", status: next });
    };

    const connect = () => {
      if (!active) return;
      clearTimeout(retry);
      setStatus("connecting");
      socket = new WebSocket(env.wsUrl);
      sharedSocket = socket;
      socket.onopen = () => {
        attempts = 0;
        // Chờ ACK trước khi đăng ký server tiếp theo để không làm đầy hàng đợi WS.
        pendingServers = serverIds.split("|").filter(Boolean);
        joinNextServer();
        if (activeChannelId) {
          socket.send(JSON.stringify({ type: "join_channel", channelId: activeChannelId }));
        }
        dispatch({ type: "ready" });
        setStatus("connected");
        void loadConversations(true);
        void loadServers(true);
      };
      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          dispatch(data);
          if (data.type === "server_joined" || data.type === "server_unavailable")
            joinNextServer();
          if (
            data.type?.startsWith("dm_") ||
            data.type === "conversations_update" ||
            data.type === "friends_update"
          )
            void loadConversations(true);
          if (data.type === "user_update") void loadCurrentUser(true);
          if (data.type === "channel_read") {
            markChannelRead(data.serverId, data.channelId);
            void loadServers(true);
            void loadServerDetail(data.serverId, true);
          }
          if (
            data.type !== "message_create" ||
            !data.serverId ||
            data.message?.author?.id === userId
          )
            return;
          const parts = pathRef.current
            .split("/")
            .filter(Boolean)
            .map(decodeURIComponent);
          if (
            parts[1] === data.serverId &&
            parts[2] === data.channelKey &&
            document.visibilityState === "visible"
          )
            return;
          const content = String(data.message?.content ?? "").toLowerCase();
          const mention = [username, displayName].some(
            (name) => name && content.includes("@" + name.toLowerCase())
          );
          applyChannelActivity(data.serverId, data.channelKey, mention);
        } catch {
          /* Ignore malformed frames; state is recovered on reconnect. */
        }
      };
      socket.onclose = () => {
        if (!active) return;
        setStatus("disconnected");
        retry = setTimeout(() => {
          void http
            .get("/auth/me")
            .then(() => {
              if (active) connect();
            })
            .catch((reason) => {
              if (!active) return;
              if (reason instanceof ApiError && reason.status === 401)
                window.location.replace("/login");
              else retry = setTimeout(connect, 5000);
            });
        }, Math.min(1000 * 2 ** attempts++, 15000));
      };
    };

    reconnectTrigger = () => {
      if (!active) return;
      socket?.close();
      connect();
    };

    connect();
    return () => {
      active = false;
      activeRealtimeMounted = false;
      sharedSocket = null;
      reconnectTrigger = null;
      clearTimeout(retry);
      socket?.close();
    };
  }, [serverIds, userId, username, displayName]);

  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (!parts[1] || !parts[2] || parts[1] === "@me") return;
    void loadServerDetail(parts[1]);
  }, [pathname]);

  return null;
}
