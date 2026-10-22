"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { env } from "@/config/env";
import { MemberList } from "@/features/members/components/MemberList";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import type { ChatMessage } from "./MessageItem";
import { http } from "@/services/http";
import { VoiceRoom } from "./VoiceRoom";
import { loadConversations } from "@/stores/workspace.store";

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "init_1",
    avatar: "B9",
    user: "Bravee9",
    time: "Hôm nay lúc 09:41",
    content: "Xin chào! Kênh chat thời gian thực qua WebSocket đã sẵn sàng hoạt động.",
    isHighlighted: true,
  },
  {
    id: "init_2",
    avatar: "SJ",
    user: "Shuji",
    time: "Hôm nay lúc 09:43",
    content: "Bạn có thể mở một tab ẩn danh (Incognito) hoặc cửa sổ khác để test chat 2 chiều ngay lập tức!",
    isHighlighted: false,
  },
];

interface ChatViewProps {
  /** Truyền từ route page. Nếu bỏ trống sẽ đọc từ URL params. */
  serverId?: string;
  channelId?: string;
}

interface CreatedMessageResponse {
  id: string;
  avatar: string;
  user: string;
  time: string;
  content: string;
  createdAt: string;
  attachments: NonNullable<ChatMessage["attachments"]>;
}

export function ChatView({ serverId, channelId }: ChatViewProps = {}) {
  const params = useParams();
  const rawServerId = decodeURIComponent(serverId ?? (params?.serverId as string) ?? "@me");
  const rawChannelId = decodeURIComponent(channelId ?? (params?.channelId as string) ?? "general");

  const isMe = rawServerId === "@me";

  const [message, setMessage] = useState("");
  const [dmDisplayName, setDmDisplayName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => env.useMocks ? DEFAULT_MESSAGES : []);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Bravee9");
  const [showMemberList, setShowMemberList] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [channelType, setChannelType] = useState<string | null>(null);

  const displayChannelName = isMe ? (rawChannelId === "friends" ? "Trang chủ" : (dmDisplayName || rawChannelId)) : rawChannelId;
  const isChannelTopic = !isMe;

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo danh tính người dùng (để test dễ dàng giữa 2 tab)
  useEffect(() => {
    if (!env.useMocks) return;
    const savedUser = sessionStorage.getItem("bravechat_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      const randomId = Math.floor(100 + Math.random() * 900);
      const generated = `User_${randomId}`;
      sessionStorage.setItem("bravechat_user", generated);
      setCurrentUser(generated);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Kết nối WebSocket theo channelId
  const effectiveChannelId = env.useMocks ? `${rawServerId}_${rawChannelId}` : rawChannelId;

  const connectWebSocket = useCallback(() => {
    const wsUrl = env.wsUrl;
    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        ws.send(
          JSON.stringify({
            type: "join_channel",
            channelId: effectiveChannelId,
            serverId: rawServerId,
            channelKey: rawChannelId,
            user: {
              username: currentUser,
              avatar: currentUser.slice(0, 2).toUpperCase(),
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "channel_joined") {
            if (env.useMocks) {
              setMessages(data.messages ?? []);
              setHasOlderMessages((data.messages?.length ?? 0) >= 50);
            } else {
              void http.get<{ messages: CreatedMessageResponse[]; hasMore: boolean }>(`/channels/${encodeURIComponent(rawChannelId)}/messages`, { query: { limit: 50 } })
                .then((history) => {
                  setMessages(history.messages.map((item) => ({ ...item, createdAt: item.createdAt })));
                  setHasOlderMessages(history.hasMore);
                })
                .catch((error) => setUploadError(error instanceof Error ? error.message : "Không thể tải lịch sử tin nhắn."));
            }
          } else if (data.type === "older_messages") {
            setMessages((previous) => [...data.messages, ...previous]);
            setHasOlderMessages(data.messages.length >= 50);
            setIsLoadingOlder(false);
          } else if (data.type === "message_create") {
            setMessages((prev) => prev.some((item) => item.id === data.message.id) ? prev : [...prev, data.message]);
          } else if (data.type === "typing_start") {
            if (data.username && data.username !== currentUser) {
              setTypingUsers((prev) => Array.from(new Set([...prev, data.username])));
            }
          } else if (data.type === "typing_stop") {
            setTypingUsers((prev) => prev.filter((u) => u !== data.username));
          }
        } catch (e) {
          console.error("Lỗi parse WS payload:", e);
        }
      };

      ws.onclose = () => {
        setIsLoadingOlder(false);
        setConnectionStatus("disconnected");
      };

      ws.onerror = (err) => {
        console.error("Lỗi WebSocket:", err);
        setConnectionStatus("disconnected");
      };
    } catch (err) {
      console.error("Không thể khởi tạo WebSocket:", err);
      setConnectionStatus("disconnected");
    }
  }, [effectiveChannelId, currentUser, rawChannelId, rawServerId]);

  useEffect(() => {
    if (env.useMocks) return;
    if (isMe && rawChannelId !== "friends") {
      http.get<{ user: { displayName: string | null; username: string } }>(`/users/${encodeURIComponent(rawChannelId)}`)
        .then(({ user }) => setDmDisplayName(user.displayName || user.username))
        .catch(() => setDmDisplayName("Người dùng"));
      return;
    }
    if (isMe) return;
    http.get<{ channel: { type: string } }>(`/channels/${encodeURIComponent(rawChannelId)}`)
      .then(({ channel }) => setChannelType(channel.type))
      .catch(() => setChannelType(null));
  }, [rawChannelId, isMe]);

  useEffect(() => {
    if (env.useMocks) return;
    http.get<{ user: { username: string; displayName?: string | null } }>("/auth/me")
      .then(({ user }) => setCurrentUser(user.displayName || user.username))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (env.useMocks) {
      connectWebSocket();
      return () => { wsRef.current?.close(); };
    }
    if (isMe) {
      if (rawChannelId === "friends") {
        setConnectionStatus("disconnected");
        setMessages([]);
        return;
      }
      let active = true;
      const loadDirectMessages = () => http.get<{ messages: Array<CreatedMessageResponse> }>(`/messages/dm/${encodeURIComponent(rawChannelId)}`)
        .then(({ messages: history }) => {
          if (!active) return;
          setMessages(history.map((item) => ({ id: item.id, avatar: item.avatar, user: item.user, time: item.time, content: item.content, createdAt: item.createdAt })));
          setConnectionStatus("connected");
        })
        .catch((error) => { if (active) { setConnectionStatus("disconnected"); setUploadError(error instanceof Error ? error.message : "Không thể tải tin nhắn riêng."); } });
      void loadDirectMessages();
      const timer = window.setInterval(() => void loadDirectMessages(), 3000);
      return () => { active = false; window.clearInterval(timer); };
    }
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, isMe, rawChannelId]);

  // Gửi thông báo đang gõ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isMe && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing_start",
          channelId: effectiveChannelId,
          username: currentUser,
        })
      );

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "typing_stop",
              channelId: effectiveChannelId,
              username: currentUser,
            })
          );
        }
      }, 1500);
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = message.trim();
    if (!content) return;

    if (!env.useMocks && isMe) {
      if (rawChannelId === "friends") return;
      try {
        const { message: sent } = await http.post<{ message: CreatedMessageResponse }>(`/messages/dm/${encodeURIComponent(rawChannelId)}`, { content });
        setMessages((previous) => previous.some((item) => item.id === sent.id) ? previous : [...previous, sent]);
        void loadConversations(true);
        setMessage("");
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Không thể gửi tin nhắn.");
      }
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "send_message",
          channelId: effectiveChannelId,
          serverId: rawServerId,
          channelKey: rawChannelId,
          content,
          user: {
            username: currentUser,
            avatar: currentUser.slice(0, 2).toUpperCase(),
          },
        })
      );

      wsRef.current.send(
        JSON.stringify({
          type: "typing_stop",
          channelId: effectiveChannelId,
          username: currentUser,
        })
      );
    } else {
      const localMsg: ChatMessage = {
        id: `local_${Date.now()}`,
        avatar: currentUser.slice(0, 2).toUpperCase(),
        user: currentUser,
        time: "Vừa xong",
        content,
      };
      setMessages((prev) => [...prev, localMsg]);
    }

    setMessage("");
  };

  const handleFiles = async (files: File[]) => {
    if (env.useMocks || isMe) {
      setUploadError("Đăng nhập và mở channel server để tải file lên.");
      return;
    }
    setIsUploading(true);
    setUploadError("");
    const uploaded: Array<{ filename: string; contentType: string; key: string }> = [];
    try {
      for (const file of files.slice(0, 10)) {
        const form = new FormData();
        form.append("purpose", "attachment");
        form.append("channelId", rawChannelId);
        form.append("file", file, file.name);
        const response = await fetch(`${env.apiUrl.replace(/\/$/, "")}/uploads`, { method: "POST", credentials: "include", body: form });
        if (!response.ok) throw new Error(`Upload ${file.name} thất bại.`);
        const result = await response.json();
        const item = result.data as { key: string; filename: string; contentType: string };
        uploaded.push({ filename: item.filename, contentType: item.contentType, key: item.key });
      }
      const result = await http.post<{ message: CreatedMessageResponse }>(`/channels/${encodeURIComponent(rawChannelId)}/messages`, {
        content: message.trim(),
        attachments: uploaded,
      });
      setMessages((previous) => previous.some((item) => item.id === result.message.id) ? previous : [...previous, {
        id: result.message.id,
        avatar: result.message.avatar,
        user: result.message.user,
        time: result.message.time,
        content: result.message.content,
        createdAt: result.message.createdAt,
        attachments: result.message.attachments,
      }]);
      setMessage("");
    } catch (error) {
      await Promise.all(uploaded.map(({ key }) => http.delete("/uploads/pending", { body: { key } }).catch(() => undefined)));
      setUploadError(error instanceof Error ? error.message : "Không thể tải tệp lên.");
    } finally {
      setIsUploading(false);
    }
  };

  const loadOlderMessages = () => {
    const oldestMessage = messages[0];
    if (!oldestMessage?.createdAt || isLoadingOlder) return;
    if (!env.useMocks) {
      setIsLoadingOlder(true);
      void http.get<{ messages: Array<CreatedMessageResponse & { id: string }>; hasMore: boolean }>(`/channels/${encodeURIComponent(rawChannelId)}/messages`, {
        query: { before: String(oldestMessage.id), limit: 50 },
      }).then(({ messages: olderMessages, hasMore }) => {
        setMessages((previous) => [...olderMessages.map((item) => ({ ...item, createdAt: item.createdAt })), ...previous]);
        setHasOlderMessages(hasMore);
      }).catch((error) => setUploadError(error instanceof Error ? error.message : "Không thể tải tin nhắn cũ hơn."))
        .finally(() => setIsLoadingOlder(false));
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setIsLoadingOlder(true);
    wsRef.current.send(JSON.stringify({
      type: "load_older_messages",
      channelId: effectiveChannelId,
      channelKey: rawChannelId,
      before: oldestMessage.createdAt,
    }));
  };

  // Đổi tên test nhanh
  const handleChangeUsername = async () => {
    const newName = prompt(env.useMocks ? "Nhập tên hiển thị để test:" : "Tên hiển thị mới:", currentUser);
    if (newName && newName.trim()) {
      const trimmed = newName.trim();
      if (!env.useMocks) {
        try {
          const result = await http.patch<{ user: { username: string; displayName: string | null } }>("/users/@me", { displayName: trimmed });
          setCurrentUser(result.user.displayName || result.user.username);
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : "Không thể cập nhật tên hiển thị.");
        }
        return;
      }
      setCurrentUser(trimmed);
      sessionStorage.setItem("bravechat_user", trimmed);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "join_channel",
            channelId: effectiveChannelId,
            user: {
              username: trimmed,
              avatar: trimmed.slice(0, 2).toUpperCase(),
            },
          })
        );
      }
    }
  };

  return (
    <div className="flex-1 flex min-w-0 h-full overflow-hidden bg-ocean-dark-bg" data-testid="chat-view">
      {/* Cột Giữa: Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ocean-primary/20 via-ocean-dark-bg to-ocean-dark-bg" />

        {/* 1. Chat Header */}
        <ChatHeader
          channelName={displayChannelName}
          isMe={isMe}
          isChannelTopic={isChannelTopic}
          currentUser={currentUser}
          connectionStatus={connectionStatus}
          showMemberList={showMemberList}
          onChangeUsername={handleChangeUsername}
          onReconnectWs={connectWebSocket}
          onToggleMemberList={() => setShowMemberList((prev) => !prev)}
        />

        {channelType === "VOICE" || channelType === "VIDEO" ? (
          <VoiceRoom channelId={rawChannelId} channelType={channelType} />
        ) : null}

        {/* 2. Message List */}
        <MessageList
          ref={messagesEndRef}
          channelName={displayChannelName}
          messages={messages}
          currentUser={currentUser}
          hasOlder={hasOlderMessages}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={loadOlderMessages}
        />

        {/* 3. Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* 4. Chat Input */}
        {isMe && rawChannelId === "friends" ? <div className="mx-6 mb-6 rounded-lg border border-ocean-dark-border bg-ocean-dark-surface/60 p-5 text-sm text-ocean-light/70">Chọn một cuộc trò chuyện hoặc nhấn dấu + để bắt đầu nhắn tin.</div> : <ChatInput
          value={message}
          placeholder={`Nhắn tin tới #${displayChannelName} (Nhấn Enter để gửi)...`}
          onChange={handleInputChange}
          onSubmit={handleSendMessage}
          onFiles={handleFiles}
          isUploading={isUploading}
        />}
        {uploadError ? <p role="alert" className="px-6 pb-2 text-xs text-rose-400">{uploadError}</p> : null}
      </main>

      {/* Cột Phải: Member List (Collapsible) */}
      {!isMe && <MemberList isVisible={showMemberList} />}
    </div>
  );
}

export const ChatArea = ChatView;
