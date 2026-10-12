"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { env } from "@/config/env";
import { MemberList } from "@/features/members/components/MemberList";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string | number;
  avatar: string;
  user: string;
  time: string;
  content: string;
  isHighlighted?: boolean;
}

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
    <div className="flex-1 flex min-w-0 h-full overflow-hidden bg-ocean-dark-bg">
      {/* ─── Cột Giữa: Chat Area ─── */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ocean-primary/20 via-ocean-dark-bg to-ocean-dark-bg" />

        {/* Header kênh */}
        <header className="h-14 border-b border-ocean-dark-border px-6 flex items-center justify-between flex-shrink-0 z-10 bg-ocean-dark-bg/80 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {isMe ? (
              <span className="text-ocean-secondary text-lg">@</span>
            ) : (
              <span className="text-ocean-light/50 font-mono text-xl">#</span>
            )}
            <h1 className="text-ocean-light font-bold text-base truncate">
              {displayChannelName}
            </h1>
            {isChannelTopic && (
              <>
                <div className="h-4 w-px bg-ocean-dark-border mx-1" />
                <span className="text-ocean-light/50 text-xs hidden md:inline truncate max-w-sm">
                  Kênh trò chuyện thời gian thực
                </span>
              </>
            )}
          </div>

          {/* Action Toolbar bên phải */}
          <div className="flex items-center gap-2.5">
            {/* Tên test user */}
            <button
              onClick={handleChangeUsername}
              title="Nhấn để đổi tên test"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-ocean-dark-border bg-ocean-dark-surface/60 hover:bg-ocean-dark-surface hover:border-ocean-secondary/50 text-ocean-light transition-all rounded"
            >
              <span className="text-ocean-light/50">Tôi:</span>
              <span className="font-bold text-ocean-secondary">{currentUser}</span>
              <span className="text-[10px] text-ocean-light/40">✏️</span>
            </button>

            {/* Trạng thái WS */}
            <div className="flex items-center gap-2 px-2.5 py-1 text-xs rounded border border-ocean-dark-border bg-ocean-dark-surface/40">
              {connectionStatus === "connected" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-medium">Live</span>
                </>
              )}
              {connectionStatus === "connecting" && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-400 font-medium">Kết nối...</span>
                </>
              )}
              {connectionStatus === "disconnected" && (
                <button
                  onClick={connectWebSocket}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  title="Nhấn để kết nối lại"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Mất kết nối ↺</span>
                </button>
              )}
            </div>

            {/* Toggle Member List */}
            {!isMe && (
              <Tooltip content={showMemberList ? "Ẩn danh sách thành viên" : "Hiện danh sách thành viên"} side="bottom">
                <button
                  onClick={() => setShowMemberList((prev) => !prev)}
                  className={cn(
                    "p-2 rounded hover:bg-white/10 transition-colors cursor-pointer",
                    showMemberList ? "text-ocean-light" : "text-ocean-light/40"
                  )}
                  aria-label="Toggle Members"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>
        </header>

        {/* Khu vực tin nhắn cuộn */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 z-10 custom-scrollbar">
          {/* Welcome Message Header */}
          <div className="my-4 pb-4 border-b border-ocean-dark-border/40">
            <div className="w-16 h-16 rounded-full bg-ocean-primary/20 border border-ocean-primary/40 flex items-center justify-center text-3xl font-extrabold text-ocean-secondary mb-3">
              #
            </div>
            <h2 className="text-2xl font-bold text-ocean-light mb-1">
              Chào mừng bạn đến với #{displayChannelName}!
            </h2>
            <p className="text-sm text-ocean-light/60">
              Đây là sự khởi đầu của kênh #{displayChannelName}. Hãy bắt đầu cuộc trò chuyện thú vị!
            </p>
          </div>

          {messages.map((msg) => {
            const isCurrentUser = msg.user === currentUser;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 group relative rounded px-3 py-2 transition-colors",
                  isCurrentUser ? "bg-ocean-primary/5 border-l-2 border-ocean-primary" : "hover:bg-ocean-dark-surface/30",
                  msg.isHighlighted ? "bg-ocean-primary/10 border-l-2 border-ocean-secondary" : ""
                )}
              >
                {/* Actions on hover */}
                <div className="absolute right-4 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-ocean-dark-surface border border-ocean-dark-border flex items-center shadow-lg rounded">
                  <button className="p-1.5 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors" title="Thêm emoji">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <div className="w-px h-3 bg-ocean-dark-border" />
                  <button className="p-1.5 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors" title="Trả lời">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                </div>

                <div className="w-10 h-10 rounded-full bg-ocean-dark-surface border border-ocean-dark-border flex-shrink-0 flex items-center justify-center text-ocean-secondary font-bold shadow-sm">
                  {msg.avatar || msg.user.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className={cn("font-bold text-sm hover:underline cursor-pointer", isCurrentUser ? "text-ocean-secondary" : "text-ocean-light")}>
                      {msg.user}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-[10px] px-1 py-0.2 bg-ocean-secondary/20 text-ocean-secondary rounded">Bạn</span>
                      )}
                    </span>
                    <span className="text-ocean-light/40 text-xs">{msg.time}</span>
                  </div>
                  <p className="text-ocean-light/90 text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-6 pb-2 text-xs text-ocean-secondary flex items-center gap-2 z-10 animate-fade-in">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span>{typingUsers.join(", ")} đang gõ tin nhắn...</span>
          </div>
        )}

        {/* Chat Input */}
        <div className="px-6 pb-6 flex-shrink-0 z-10">
          <form onSubmit={handleSendMessage} className="relative flex items-center bg-ocean-dark-surface/50 border border-ocean-dark-border focus-within:border-ocean-secondary/60 focus-within:bg-ocean-dark-surface focus-within:shadow-ocean-glow transition-all duration-300 rounded-lg">
            <button type="button" className="pl-4 pr-3 py-3 text-ocean-light/50 hover:text-ocean-light transition-colors" title="Đính kèm tệp">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder={`Nhắn tin tới #${displayChannelName} (Nhấn Enter để gửi)...`}
              className="flex-1 bg-transparent border-none text-ocean-light text-sm focus:outline-none py-3 px-1 placeholder:text-ocean-light/30"
            />

            <div className="pr-3 pl-2 py-3 flex items-center gap-2 text-ocean-light/50">
              <button
                type="submit"
                disabled={!message.trim()}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  message.trim()
                    ? "bg-ocean-primary text-white hover:bg-ocean-secondary shadow-ocean-glow cursor-pointer"
                    : "text-ocean-light/30 cursor-not-allowed"
                )}
                title="Gửi tin nhắn"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* ─── Cột Phải: Member List (Collapsible) ─── */}
      {!isMe && <MemberList isVisible={showMemberList} />}
    </div>
  );
}

export const ChatArea = ChatView;
