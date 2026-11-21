"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { env } from "@/config/env";
import { ApiError, http } from "@/services/http";
import {
  getCachedChannelName,
  getCachedServerDetail,
  loadConversations,
  loadServerDetail,
  useCurrentUser,
} from "@/stores/workspace.store";
import {
  getSharedRealtimeStatus,
  hasActiveWorkspaceRealtime,
  joinWorkspaceRealtimeChannel,
  leaveWorkspaceRealtimeChannel,
  reconnectWorkspaceRealtime,
  sendWorkspaceRealtimeFrame,
} from "@/stores/WorkspaceRealtime";
import { CloseIcon, LockIcon } from "@/components/ui/Icons";
import {
  openWorkspaceModal,
  setPreviewAsRole,
  updateServerWorkspaceConfig,
  usePreviewAsRoleId,
  useServerWorkspaceConfig,
} from "@/stores/ide-workspace.store";
import { MemberList } from "@/features/members/components/MemberList";
import { UserCard } from "@/features/members/components/UserCard";
import { FriendsPanel } from "@/features/members/components/FriendsPanel";
import { useFriendshipRelation } from "@/features/members/useFriendshipRelation";
import { DmUserProfileSidebar } from "@/features/channels/components/DmUserProfileSidebar";
import { DialogFrame } from "@/components/ui/DialogFrame";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { VoiceRoom } from "./VoiceRoom";
import type { ChatMessage } from "./MessageItem";

type StoredMessage = ChatMessage & { id: string; createdAt: string };
type Page = { messages: StoredMessage[]; hasMore: boolean };
type ChannelMetadata = {
  channel?: { name?: string; type?: string | null };
  user?: { displayName?: string | null; username?: string };
};
type RealtimeEvent = {
  type?: string;
  channelId?: string;
  messageId?: string | number;
  message?: StoredMessage;
  username?: string;
  senderId?: string;
  receiverId?: string;
  status?: "connected" | "connecting" | "disconnected";
  errorMessage?: string;
};
interface ChatViewProps {
  serverId?: string;
  channelId?: string;
}
export const mergeMessages = (
  existing: ChatMessage[],
  incoming: ChatMessage[]
) => {
  const byId = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime() ||
      String(a.id).localeCompare(String(b.id))
  );
};
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRealtimeEvent(value: unknown): RealtimeEvent | null {
  if (!isRecord(value)) return null;
  const message =
    isRecord(value.message) && typeof value.message.id === "string"
      ? (value.message as unknown as StoredMessage)
      : undefined;
  return {
    type: typeof value.type === "string" ? value.type : undefined,
    channelId:
      typeof value.channelId === "string" ? value.channelId : undefined,
    messageId:
      typeof value.messageId === "string" || typeof value.messageId === "number"
        ? value.messageId
        : undefined,
    message,
    username: typeof value.username === "string" ? value.username : undefined,
    senderId: typeof value.senderId === "string" ? value.senderId : undefined,
    receiverId:
      typeof value.receiverId === "string" ? value.receiverId : undefined,
    status:
      value.status === "connected" ||
      value.status === "connecting" ||
      value.status === "disconnected"
        ? value.status
        : undefined,
    errorMessage:
      typeof value.message === "string" ? value.message : undefined,
  };
}

function applyEvent(
  previous: ChatMessage[],
  data: RealtimeEvent
): ChatMessage[] {
  if (data.type === "message_delete" || data.type === "dm_delete")
    return previous
      .filter((item) => item.id !== data.messageId)
      .map((item) =>
        item.replyTo && item.replyTo.id === data.messageId
          ? {
              ...item,
              replyTo: { ...item.replyTo, content: "Tin nhắn đã xóa" },
            }
          : item
      );
  const message = data.message;
  if (message && typeof message.id === "string")
    return mergeMessages(previous, [message]).map((item) =>
      item.replyTo && item.replyTo.id === message.id
        ? { ...item, replyTo: { ...item.replyTo, content: message.content } }
        : item
    );
  return previous;
}
export function ChatView({ serverId, channelId }: ChatViewProps = {}) {
  const params = useParams();
  const rawServerId = decodeURIComponent(
    serverId ?? (params?.serverId as string) ?? "@me"
  );
  const rawChannelId = decodeURIComponent(
    channelId ?? (params?.channelId as string) ?? "general"
  );
  // Reset ngay trong render khi đổi route, tránh hiển thị tên/tin nhắn của kênh cũ.
  return (
    <ChannelChat
      key={`${rawServerId}:${rawChannelId}`}
      rawServerId={rawServerId}
      rawChannelId={rawChannelId}
    />
  );
}
function ChannelChat({
  rawServerId,
  rawChannelId,
}: {
  rawServerId: string;
  rawChannelId: string;
}) {
  const isMe = rawServerId === "@me";
  const friends = isMe && rawChannelId === "friends";
  const user = useCurrentUser();
  const workspaceConfig = useServerWorkspaceConfig(rawServerId);
  const previewAsRoleId = usePreviewAsRoleId();
  const dmRelation = useFriendshipRelation(isMe && !friends ? rawChannelId : undefined);

  const currentUser = user?.displayName || user?.username || "";
  const key = (isMe ? "dm:" : "channel:") + rawChannelId;
  const routeRef = useRef(key);
  routeRef.current = key;
  const resolveCachedName = useCallback(
    () => getCachedChannelName(rawServerId, rawChannelId),
    [rawServerId, rawChannelId]
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState(() => resolveCachedName() ?? "Đang tải...");
  const [channelType, setChannelType] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [status, setStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >(() =>
    hasActiveWorkspaceRealtime() ? getSharedRealtimeStatus() : "connecting"
  );
  const [typing, setTyping] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(true);
  const [error, setError] = useState("");
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [dialog, setDialog] = useState<{
    type: "edit" | "delete";
    message: ChatMessage;
  } | null>(null);
  const [edited, setEdited] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const attemptRef = useRef<{
    key: string;
    content: string;
    replyToId?: string;
    nonce: string;
  } | null>(null);
  const historyPath = isMe
    ? "/messages/dm/" + encodeURIComponent(rawChannelId)
    : "/channels/" + encodeURIComponent(rawChannelId) + "/messages";
  const reconnect = useCallback(() => {
    if (hasActiveWorkspaceRealtime()) {
      reconnectWorkspaceRealtime();
    } else {
      setReconnectKey((value) => value + 1);
    }
  }, []);

  const channelPolicy = !isMe
    ? workspaceConfig.channelPolicies[rawChannelId]
    : undefined;
  const cachedServerDetail = !isMe ? getCachedServerDetail(rawServerId) : null;
  const serverChannel = cachedServerDetail?.channels.find(
    (ch) => ch.id === rawChannelId
  );
  const isPrivateChannel = Boolean(
    channelPolicy?.isPrivate ?? serverChannel?.isPrivate
  );
  const isServerOwner = Boolean(
    user?.id && cachedServerDetail?.ownerId && user.id === cachedServerDetail.ownerId
  );
  const memberPerms = cachedServerDetail?.memberPermissions;
  const previewRoleObj = previewAsRoleId
    ? workspaceConfig.roles.find((r) => r.id === previewAsRoleId)
    : null;
  const canManageChannels = previewAsRoleId
    ? Boolean(previewRoleObj?.permissions.manage_channels)
    : isServerOwner || (memberPerms ? Boolean(memberPerms.manage_channels) : true);
  const canOpenWorkspaceSettings = previewAsRoleId
    ? Boolean(
        previewRoleObj?.permissions.manage_server ||
          previewRoleObj?.permissions.manage_channels ||
          previewRoleObj?.permissions.manage_roles
      )
    : isServerOwner ||
      (memberPerms
        ? Boolean(
            memberPerms.manage_server ||
              memberPerms.manage_channels ||
              memberPerms.manage_roles ||
              memberPerms.kick_members ||
              memberPerms.ban_members
          )
        : true);
  const isRoleBlockedByPreview =
    !isMe &&
    isPrivateChannel &&
    previewAsRoleId !== null &&
    !(
      channelPolicy?.allowedRoleIds ??
      serverChannel?.allowedRoleIds ??
      ["OWNER", "ADMIN"]
    ).includes(previewAsRoleId);

  useEffect(() => {
    setMessage("");
    setMessages([]);
    setPendingMessages([]);
    setReplyTo(null);
    setDialog(null);
    setError("");
    setAccessRestricted(false);
    setTyping([]);
    setHasMore(false);
    setChannelType(null);
    setName(resolveCachedName() ?? "Đang tải...");
    if (friends) return;
    if (rawChannelId.startsWith("local-ch-")) {
      setStatus("connected");
      setName(rawChannelId.replace("local-ch-", "kenh-"));
      return;
    }
    let active = true;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;
    let retries = 0;
    let version = 0;
    let readTimer: ReturnType<typeof setTimeout>;
    let fetching = false;
    let buffered: RealtimeEvent[] = [];
    const abort = new AbortController();
    const markRead = () => {
      if (isMe || document.visibilityState !== "visible") return;
      clearTimeout(readTimer);
      readTimer = setTimeout(() => {
        void http
          .post("/channels/" + encodeURIComponent(rawChannelId) + "/read")
          .catch(() => undefined);
      }, 500);
    };
    const receive = (event: RealtimeEvent) => {
      if (fetching) buffered.push(event);
      setMessages((previous) => applyEvent(previous, event));
      if (!isMe && event.type === "message_create") markRead();
    };
    const load = async () => {
      const current = ++version;
      fetching = true;
      buffered = [];
      try {
        const page = await http.get<Page>(historyPath, {
          signal: abort.signal,
          query: isMe
            ? { read: document.visibilityState === "visible" ? "true" : "false" }
            : undefined,
        });
        if (!active || current !== version) return;
        const changes = buffered.slice();
        fetching = false;
        setMessages((previous) => {
          const first = page.messages[0];
          const older =
            first && page.hasMore
              ? previous.filter(
                  (item) =>
                    new Date(item.createdAt ?? 0).getTime() <
                    new Date(first.createdAt).getTime()
                )
              : [];
          return changes.reduce(
            applyEvent,
            mergeMessages(older, page.messages)
          );
        });
        setHasMore(page.hasMore);
        setStatus("connected");
        markRead();
      } catch (reason) {
        if (active && current === version) {
          fetching = false;
          if (
            reason instanceof ApiError &&
            (reason.status === 403 || reason.status === 404)
          ) {
            setAccessRestricted(true);
          } else {
            setError(
              reason instanceof Error
                ? reason.message
                : "Không thể tải lịch sử."
            );
          }
        }
      }
    };
    void http
      .get<ChannelMetadata>(
        isMe
          ? "/users/" + encodeURIComponent(rawChannelId)
          : "/channels/" + encodeURIComponent(rawChannelId),
        { signal: abort.signal }
      )
      .then((result) => {
        if (active) {
          setName(
            isMe
              ? result.user?.displayName ||
                  result.user?.username ||
                  "Người dùng"
              : result.channel?.name || "Kênh"
          );
          if (!isMe) setChannelType(result.channel?.type ?? null);
        }
      })
      .catch((reason) => {
        if (!active) return;
        if (
          reason instanceof ApiError &&
          (reason.status === 403 || reason.status === 404)
        ) {
          setAccessRestricted(true);
        } else {
          setError(
            reason instanceof Error
              ? reason.message
              : "Không thể tải thông tin kênh."
          );
        }
      });
    const handleIncomingEvent = (data: RealtimeEvent) => {
      if (data.type === "channel_joined" && (!data.channelId || data.channelId === rawChannelId)) {
        retries = 0;
        void load();
      } else if (
        data.channelId === rawChannelId &&
        data.type &&
        ["message_create", "message_update", "message_delete"].includes(data.type)
      ) {
        receive(data);
      } else if (
        data.type === "typing_start" &&
        (!data.channelId || data.channelId === rawChannelId) &&
        data.username &&
        data.username !== user?.username
      ) {
        const username = data.username;
        setTyping((previous) => Array.from(new Set([...previous, username])));
      } else if (
        data.type === "typing_stop" &&
        (!data.channelId || data.channelId === rawChannelId) &&
        data.username
      ) {
        const username = data.username;
        setTyping((previous) => previous.filter((value) => value !== username));
      } else if (data.type === "error") {
        setError(data.errorMessage ?? "Máy chủ không thể xử lý yêu cầu.");
      }
    };
    const useSharedGateway = hasActiveWorkspaceRealtime();
    const userEvent = (event: Event) => {
      const data = toRealtimeEvent((event as CustomEvent<unknown>).detail);
      if (!data) return;
      if (data.type === "ready" && isMe) void load();
      if ((isMe || useSharedGateway) && data.type === "connection" && data.status) {
        setStatus(data.status);
        if (data.status === "disconnected") setTyping([]);
      }
      if (
        isMe &&
        data.type?.startsWith("dm_") &&
        (data.senderId === rawChannelId || data.receiverId === rawChannelId)
      ) {
        receive(data);
        if (
          data.type === "dm_create" &&
          document.visibilityState === "visible"
        )
          void http
            .get(historyPath, { query: { limit: 1 } })
            .catch(() => undefined);
      }
      if (!isMe && useSharedGateway) {
        handleIncomingEvent(data);
      }
    };
    window.addEventListener("bravechat:realtime", userEvent);
    const visible = () => {
      if (document.visibilityState === "visible") {
        if (isMe) void load();
        else markRead();
      }
    };
    document.addEventListener("visibilitychange", visible);
    const connect = () => {
      if (!active) return;
      setStatus("connecting");
      socket = new WebSocket(env.wsUrl);
      wsRef.current = socket;
      const currentSocket = socket;
      currentSocket.onopen = () =>
        currentSocket.send(
          JSON.stringify({ type: "join_channel", channelId: rawChannelId })
        );
      currentSocket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = toRealtimeEvent(JSON.parse(event.data));
          if (!data) return;
          handleIncomingEvent(data);
        } catch {
          setError("Không đọc được cập nhật từ máy chủ.");
        }
      };
      currentSocket.onclose = (event) => {
        if (!active) return;
        setStatus("disconnected");
        setTyping([]);
        if (event.code === 1008 && event.reason !== "Session expired") {
          setAccessRestricted(true);
          return;
        }
        retryTimer = setTimeout(() => {
          void http
            .get("/auth/me")
            .then(() => {
              if (active) connect();
            })
            .catch((reason) => {
              if (!active) return;
              if (reason instanceof ApiError && reason.status === 401)
                window.location.replace("/login");
              else retryTimer = setTimeout(connect, 5000);
            });
        }, Math.min(1000 * 2 ** retries++, 15000));
      };
      currentSocket.onerror = () => {
        if (active) setStatus("disconnected");
      };
    };
    if (isMe) {
      setStatus(useSharedGateway ? getSharedRealtimeStatus() : "connected");
      void load();
    } else if (useSharedGateway) {
      setStatus(getSharedRealtimeStatus());
      joinWorkspaceRealtimeChannel(rawChannelId);
      void load();
    } else {
      connect();
    }
    return () => {
      active = false;
      abort.abort();
      clearTimeout(retryTimer);
      clearTimeout(readTimer);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (!isMe && useSharedGateway) {
        leaveWorkspaceRealtimeChannel(rawChannelId);
      }
      socket?.close();
      wsRef.current = null;
      window.removeEventListener("bravechat:realtime", userEvent);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [
    key,
    historyPath,
    friends,
    isMe,
    rawChannelId,
    reconnectKey,
    user?.username,
    resolveCachedName,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendTyping = (type: string) => {
    if (hasActiveWorkspaceRealtime()) {
      sendWorkspaceRealtimeFrame({ type, channelId: rawChannelId });
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, channelId: rawChannelId }));
    }
  };

  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const content = message.trim();
    if (!content || friends || sendingRef.current) return;
    if (rawChannelId.startsWith("local-ch-")) {
      const localMsg: StoredMessage = {
        id: `local-msg-${Date.now()}`,
        avatar: (currentUser || "U").slice(0, 2).toUpperCase(),
        user: currentUser || "Bạn",
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content,
        createdAt: new Date().toISOString(),
        author: user
          ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
            }
          : undefined,
      };
      setMessages((prev) => [...prev, localMsg]);
      setMessage("");
      setReplyTo(null);
      return;
    }
    const replyToId = replyTo ? String(replyTo.id) : undefined;
    if (
      !attemptRef.current ||
      attemptRef.current.key !== key ||
      attemptRef.current.content !== content ||
      attemptRef.current.replyToId !== replyToId
    )
      attemptRef.current = {
        key,
        content,
        replyToId,
        nonce: crypto.randomUUID(),
      };
    const attempt = attemptRef.current;
    const optimisticMsg: ChatMessage = {
      id: `pending-${attempt.nonce}`,
      avatar: (currentUser || "U").slice(0, 2).toUpperCase(),
      user: currentUser || "Bạn",
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      content,
      createdAt: new Date().toISOString(),
      isPending: true,
      replyTo: replyTo
        ? { id: String(replyTo.id), user: replyTo.user, content: replyTo.content }
        : null,
      author: user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
          }
        : undefined,
    };
    sendingRef.current = true;
    setSending(true);
    setError("");
    setPendingMessages((prev) => [
      ...prev.filter((item) => item.id !== optimisticMsg.id),
      optimisticMsg,
    ]);
    try {
      const result = await http.post<{ message: StoredMessage }>(historyPath, {
        content,
        replyToId,
        nonce: attempt.nonce,
      });
      if (routeRef.current === attempt.key) {
        setPendingMessages((prev) =>
          prev.filter((item) => item.id !== optimisticMsg.id)
        );
        setMessages((previous) => mergeMessages(previous, [result.message]));
        setMessage("");
        setReplyTo(null);
        sendTyping("typing_stop");
      }
      attemptRef.current = null;
      if (isMe) void loadConversations(true);
    } catch (reason) {
      if (routeRef.current === attempt.key) {
        setPendingMessages((prev) =>
          prev.filter((item) => item.id !== optimisticMsg.id)
        );
        setError(
          "Chưa xác nhận gửi thành công. Nội dung được giữ lại; nhấn Gửi để thử lại. " +
            (reason instanceof Error ? reason.message : "")
        );
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setUploading(true);
    setError("");
    const savedKey = key;
    const uploaded: Array<{
      filename: string;
      contentType: string;
      key: string;
    }> = [];
    try {
      for (const file of files.slice(0, 10)) {
        const form = new FormData();
        form.append("purpose", "attachment");
        form.append("channelId", rawChannelId);
        form.append("file", file, file.name);
        const result = await http.post<{
          filename: string;
          contentType: string;
          key: string;
        }>("/uploads", form);
        uploaded.push(result);
      }
      const result = await http.post<{ message: StoredMessage }>(historyPath, {
        content: message.trim(),
        attachments: uploaded,
        replyToId: replyTo ? String(replyTo.id) : undefined,
        nonce: crypto.randomUUID(),
      });
      if (routeRef.current === savedKey) {
        setMessages((previous) => mergeMessages(previous, [result.message]));
        setMessage("");
        setReplyTo(null);
      }
      if (isMe) void loadConversations(true);
    } catch (reason) {
      await Promise.all(
        uploaded.map(({ key: pending }) =>
          http
            .delete("/uploads/pending", { body: { key: pending } })
            .catch(() => undefined)
        )
      );
      if (routeRef.current === savedKey)
        setError(
          reason instanceof Error ? reason.message : "Không thể tải tệp."
        );
    } finally {
      sendingRef.current = false;
      setUploading(false);
    }
  };

  const loadOlder = async () => {
    if (!messages[0] || olderBusy) return;
    const savedKey = key;
    setOlderBusy(true);
    try {
      const page = await http.get<Page>(historyPath, {
        query: { before: String(messages[0].id), limit: 50 },
      });
      if (routeRef.current === savedKey) {
        setMessages((previous) => mergeMessages(previous, page.messages));
        setHasMore(page.hasMore);
      }
    } catch (reason) {
      if (routeRef.current === savedKey)
        setError(
          reason instanceof Error
            ? reason.message
            : "Không thể tải tin nhắn cũ."
        );
    } finally {
      setOlderBusy(false);
    }
  };

  const actionPath = (item: ChatMessage) =>
    isMe
      ? "/messages/dm/" +
        encodeURIComponent(rawChannelId) +
        "/" +
        encodeURIComponent(String(item.id))
      : "/messages/" + encodeURIComponent(String(item.id));

  const reaction = async (
    item: ChatMessage,
    emoji: string,
    remove: boolean
  ) => {
    const savedKey = key;
    setError("");
    try {
      const path = actionPath(item) + "/reactions";
      const result = remove
        ? await http.delete<{ message: StoredMessage }>(
            path + "/" + encodeURIComponent(emoji)
          )
        : await http.post<{ message: StoredMessage }>(path, { emoji });
      if (routeRef.current === savedKey)
        setMessages((previous) =>
          applyEvent(previous, { message: result.message })
        );
    } catch (reason) {
      if (routeRef.current === savedKey)
        setError(
          reason instanceof Error ? reason.message : "Không thể cập nhật emoji."
        );
    }
  };

  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dialog || actionBusy) return;
    const savedKey = key;
    setActionBusy(true);
    setError("");
    try {
      if (dialog.type === "edit") {
        const result = await http.patch<{ message: StoredMessage }>(
          actionPath(dialog.message),
          { content: edited }
        );
        if (routeRef.current === savedKey)
          setMessages((previous) =>
            applyEvent(previous, { message: result.message })
          );
      } else {
        await http.delete(actionPath(dialog.message));
        if (routeRef.current === savedKey)
          setMessages((previous) =>
            applyEvent(previous, {
              type: "message_delete",
              messageId: dialog.message.id,
            })
          );
      }
      if (routeRef.current === savedKey) setDialog(null);
    } catch (reason) {
      if (routeRef.current === savedKey)
        setError(
          reason instanceof Error
            ? reason.message
            : "Không thể cập nhật tin nhắn."
        );
    } finally {
      setActionBusy(false);
    }
  };

  const handleQuickTogglePrivacy = () => {
    const nextPrivate = !isPrivateChannel;
    updateServerWorkspaceConfig(rawServerId, (prev) => {
      const current = prev.channelPolicies[rawChannelId] ?? {
        isPrivate: isPrivateChannel,
        allowedRoleIds: serverChannel?.allowedRoleIds ?? ["OWNER", "ADMIN"],
      };
      return {
        ...prev,
        channelPolicies: {
          ...prev.channelPolicies,
          [rawChannelId]: {
            ...current,
            isPrivate: nextPrivate,
          },
        },
      };
    });
    void http
      .patch(
        `/servers/${encodeURIComponent(rawServerId)}/channels/${encodeURIComponent(rawChannelId)}`,
        { isPrivate: nextPrivate }
      )
      .then(() => {
        void loadServerDetail(rawServerId, true);
      })
      .catch(() => undefined);
  };

  if (friends) return <FriendsPanel />;

  return (
    <div
      className="flex-1 flex min-w-0 h-full overflow-hidden bg-[#1E1F22]"
      data-testid="chat-view"
    >
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <ChatHeader
          channelName={name}
          isMe={isMe}
          isChannelTopic={!isMe}
          isPrivateChannel={isPrivateChannel}
          currentUser={currentUser}
          connectionStatus={status}
          showMemberList={showMembers}
          onChangeUsername={() => {
            if (user) setInspected(user.id);
          }}
          onReconnectWs={reconnect}
          onToggleMemberList={() => setShowMembers((value) => !value)}
          onToggleChannelPrivacy={
            !isMe && canManageChannels ? handleQuickTogglePrivacy : undefined
          }
          onOpenWorkspaceSettings={
            !isMe && canOpenWorkspaceSettings
              ? () => openWorkspaceModal(rawServerId, "roles")
              : undefined
          }
        />

        {/* Màn hình bảo vệ khi Kênh riêng tư hoặc người dùng không có quyền truy cập (Chống lộ channel) */}
        {accessRestricted || isRoleBlockedByPreview ? (
          <div
            data-testid="channel-access-guard"
            className="flex-1 flex items-center justify-center p-6 bg-[#1E1F22]"
          >
            <div className="max-w-md w-full bg-[#18181B] border border-[#2B2D30] rounded-[6px] p-6 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-[6px] bg-[#FDB60D]/15 border border-[#FDB60D]/40 text-[#FDB60D] flex items-center justify-center mx-auto">
                <LockIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Kênh riêng tư hoặc giới hạn quyền truy cập
                </h2>
                <p className="text-xs text-[#A8A8B0] mt-1.5 leading-relaxed">
                  {isRoleBlockedByPreview
                    ? `Kênh #${name} đang được khóa riêng tư. Vai trò xem thử hiện tại (${previewAsRoleId}) không nằm trong danh sách được phép xem nội dung kênh này.`
                    : "Bạn chưa tham gia máy chủ này hoặc vai trò hiện tại của bạn không có quyền xem nội dung kênh. Mọi tin nhắn và tệp đính kèm đã được ẩn để bảo mật."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {isRoleBlockedByPreview && (
                  <button
                    type="button"
                    onClick={() => setPreviewAsRole(null)}
                    className="px-3.5 py-2 rounded-[4px] bg-[#087CFA] hover:bg-[#07C3F2] hover:text-[#0B0B0D] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Trở về quyền Mặc định
                  </button>
                )}
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => openWorkspaceModal(rawServerId, "channels")}
                    className="px-3.5 py-2 rounded-[4px] border border-[#2B2D30] bg-[#1E1F22] hover:bg-[#2B2D30] text-xs font-medium text-[#E6EDF3] transition-colors cursor-pointer"
                  >
                    Cấu hình quyền kênh
                  </button>
                )}
                <Link
                  href="/channels/@me"
                  className="px-3.5 py-2 rounded-[4px] border border-[#2B2D30] bg-[#141417] hover:bg-[#2B2D30] text-xs font-medium text-[#A8A8B0] hover:text-white transition-colors cursor-pointer"
                >
                  Về Trang chủ (@me)
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {(channelType === "VOICE" || channelType === "VIDEO") && (
              <VoiceRoom channelId={rawChannelId} channelType={channelType} />
            )}
            <MessageList
              ref={bottomRef}
              channelName={name}
              isMe={isMe}
              messages={messages}
              pendingMessages={pendingMessages}
              currentUser={currentUser}
              currentUserId={user?.id}
              hasOlder={hasMore}
              isLoadingOlder={olderBusy}
              onLoadOlder={loadOlder}
              onReply={setReplyTo}
              onReaction={(item, emoji, remove) =>
                void reaction(item, emoji, remove)
              }
              onEdit={(item) => {
                setEdited(item.content);
                setDialog({ type: "edit", message: item });
              }}
              onDelete={(item) => setDialog({ type: "delete", message: item })}
              onInspect={setInspected}
            />
            <div className="min-h-[22px] flex items-center flex-shrink-0">
              <TypingIndicator typingUsers={typing} />
            </div>
            {isMe && dmRelation.relation.kind === "blocked" && (
              <div
                role="status"
                data-testid="dm-blocked-banner"
                className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-[4px] border border-[#393B40] bg-[#18181B] px-3 py-2 text-xs text-[#CDCDCD]"
              >
                <span>Bạn đang chặn người dùng này nên không thể gửi tin nhắn.</span>
                <button
                  type="button"
                  disabled={dmRelation.busy}
                  onClick={() =>
                    void dmRelation.unblockUser().then((ok) => {
                      if (ok) setError("");
                    })
                  }
                  className="px-2.5 py-1 rounded-[4px] bg-[#2B2D30] hover:bg-[#393B40] text-white font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {dmRelation.busy ? "Đang xử lý..." : "Bỏ chặn"}
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="mx-4 mb-2 rounded-[4px] border border-[#FE2857]/40 bg-[#FE2857]/10 px-3 py-1.5 text-xs text-[#FE2857]">
                {error}
              </p>
            )}
            {replyTo && (
              <div className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-[4px] border border-[#2B2D30] bg-[#18181B] px-3 py-2 text-xs text-[#A8A8B0]">
                <span className="truncate">
                  Trả lời {replyTo.user}: {replyTo.content}
                </span>
                <button
                  type="button"
                  aria-label="Hủy trả lời"
                  onClick={() => setReplyTo(null)}
                  className="text-[#7D7D7D] hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <ChatInput
              value={message}
              placeholder={
                isMe ? "Nhắn tin tới " + name : "Nhắn tin tới #" + name
              }
              onChange={(event) => {
                setMessage(event.target.value);
                sendTyping("typing_start");
                if (typingTimer.current) clearTimeout(typingTimer.current);
                typingTimer.current = setTimeout(
                  () => sendTyping("typing_stop"),
                  1500
                );
              }}
              onSubmit={handleSend}
              onFiles={handleFiles}
              onInsertSnippet={() =>
                setMessage((prev) =>
                  prev ? `${prev}\n\`\`\`\n\n\`\`\`` : "```\n\n```"
                )
              }
              isUploading={uploading}
              isSending={sending}
            />
          </>
        )}
      </main>
      {!isMe && <MemberList isVisible={showMembers} serverId={rawServerId} />}
      {isMe && !friends && showMembers && (
        <DmUserProfileSidebar
          userId={rawChannelId}
          onClose={() => setShowMembers(false)}
        />
      )}
      {inspected && (
        <UserCard userId={inspected} onClose={() => setInspected(null)} />
      )}
      {dialog && (
        <DialogFrame
          title={dialog.type === "edit" ? "Sửa tin nhắn" : "Xóa tin nhắn"}
          onClose={() => {
            if (!actionBusy) setDialog(null);
          }}
        >
          <form onSubmit={submitAction} className="space-y-4">
            {dialog.type === "edit" ? (
              <label className="block text-sm">
                Nội dung
                <textarea
                  autoFocus
                  className="input-ocean mt-2 w-full"
                  value={edited}
                  required
                  maxLength={2000}
                  onChange={(event) => setEdited(event.target.value)}
                />
              </label>
            ) : (
              <p>Bạn muốn xóa tin nhắn này?</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={actionBusy}
                className="btn-secondary"
                onClick={() => setDialog(null)}
              >
                Hủy
              </button>
              <button
                className="btn-primary"
                disabled={
                  actionBusy || (dialog.type === "edit" && !edited.trim())
                }
              >
                {actionBusy ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </form>
        </DialogFrame>
      )}
    </div>
  );
}
export const ChatArea = ChatView;
