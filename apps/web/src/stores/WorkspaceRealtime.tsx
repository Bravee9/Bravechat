"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { env } from "@/config/env";
import { applyChannelActivity, loadServerDetail, markChannelRead, useCurrentUser, useServers } from "./workspace.store";

export function WorkspaceRealtime() {
  const servers = useServers();
  const currentUser = useCurrentUser();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const serverIds = servers.map((server) => server.id).join("|");

  useEffect(() => {
    if (!serverIds) return;
    const sockets = serverIds.split("|").map((serverId) => {
      const socket = new WebSocket(env.wsUrl);
      socket.onopen = () => socket.send(JSON.stringify({ type: "join_server", serverId }));
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type !== "message_create" || payload.serverId !== serverId) return;
        const routeParts = pathnameRef.current.split("/").filter(Boolean);
        const activeServerId = routeParts[1] ? decodeURIComponent(routeParts[1]) : "@me";
        const activeChannelId = routeParts[2] ? decodeURIComponent(routeParts[2]) : "";
        if (activeServerId === serverId && activeChannelId === payload.channelKey) return;
        const username = currentUser?.username;
        const displayName = currentUser?.displayName;
        const content = String(payload.message?.content ?? "").toLowerCase();
        const mention = Boolean(username && content.includes(`@${username.toLowerCase()}`))
          || Boolean(displayName && content.includes(`@${displayName.toLowerCase()}`));
        applyChannelActivity(serverId, payload.channelKey, mention);
      };
      return socket;
    });
    return () => sockets.forEach((socket) => socket.close());
  }, [serverIds, currentUser?.username, currentUser?.displayName]);

  useEffect(() => {
    const [, serverId, channelId] = pathname.split("/").filter(Boolean);
    if (!serverId || !channelId || serverId === "@me") return;
    const decodedServerId = decodeURIComponent(serverId);
    const decodedChannelId = decodeURIComponent(channelId);
    void loadServerDetail(decodedServerId).then(() => markChannelRead(decodedServerId, decodedChannelId));
  }, [pathname]);

  return null;
}
