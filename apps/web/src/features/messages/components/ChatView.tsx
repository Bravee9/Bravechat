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

export function ChatView() {
  const params = useParams();
  const rawServerId = decodeURIComponent((params?.serverId as string) || "@me");
  const rawChannelId = decodeURIComponent((params?.channelId as string) || "general");

  const isMe = rawServerId === "@me";

  // Tên kênh hiển thị
  let displayChannelName = rawChannelId;
  let isChannelTopic = true;
  if (isMe) {
    if (rawChannelId.startsWith("dm_")) {
      displayChannelName = rawChannelId.replace("dm_", "");
      isChannelTopic = false;
    } else {
      displayChannelName = "Trang chủ";
      isChannelTopic = false;
    }
  }

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Bravee9");
  const [showMemberList, setShowMemberList] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo danh tính người dùng (để test dễ dàng giữa 2 tab)
  useEffect(() => {
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
  const effectiveChannelId = `${rawServerId}_${rawChannelId}`;

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
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages);
            }
          } else if (data.type === "message_create") {
            setMessages((prev) => [...prev, data.message]);
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
  }, [effectiveChannelId, currentUser]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Gửi thông báo đang gõ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = message.trim();
    if (!content) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "send_message",
          channelId: effectiveChannelId,
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

  // Đổi tên test nhanh
  const handleChangeUsername = () => {
    const newName = prompt("Nhập tên hiển thị để test:", currentUser);
    if (newName && newName.trim()) {
      const trimmed = newName.trim();
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

        {/* 2. Message List */}
        <MessageList
          ref={messagesEndRef}
          channelName={displayChannelName}
          messages={messages}
          currentUser={currentUser}
        />

        {/* 3. Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* 4. Chat Input */}
        <ChatInput
          value={message}
          placeholder={`Nhắn tin tới #${displayChannelName} (Nhấn Enter để gửi)...`}
          onChange={handleInputChange}
          onSubmit={handleSendMessage}
        />
      </main>

      {/* Cột Phải: Member List (Collapsible) */}
      {!isMe && <MemberList isVisible={showMemberList} />}
    </div>
  );
}

export const ChatArea = ChatView;
