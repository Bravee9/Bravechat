"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
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

export function ChatArea() {
  const params = useParams();
  const serverId = decodeURIComponent((params.serverId as string) || "@me");
  
  const isMe = serverId === "@me";
  const channelName = isMe ? "Trang chủ" : `general (#${serverId})`;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Bravee9");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo danh tính người dùng (để test dễ dàng giữa 2 tab)
  useEffect(() => {
    const savedUser = sessionStorage.getItem("bravechat_user");
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      // Tự sinh tên người dùng ngẫu nhiên để phân biệt giữa các tab
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

  // Kết nối WebSocket
  const connectWebSocket = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/api/ws";
    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
        // Gửi lệnh join channel
        ws.send(
          JSON.stringify({
            type: "join_channel",
            channelId: serverId,
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
  }, [serverId, currentUser]);

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
          channelId: serverId,
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
              channelId: serverId,
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
          channelId: serverId,
          content,
          user: {
            username: currentUser,
            avatar: currentUser.slice(0, 2).toUpperCase(),
          },
        })
      );

      // Dừng typing
      wsRef.current.send(
        JSON.stringify({
          type: "typing_stop",
          channelId: serverId,
          username: currentUser,
        })
      );
    } else {
      // Fallback cục bộ nếu mất kết nối
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
    const newName = prompt("Nhập tên hiển thị để test (ví dụ: Bravee9, Shuji, Tester):", currentUser);
    if (newName && newName.trim()) {
      const trimmed = newName.trim();
      setCurrentUser(trimmed);
      sessionStorage.setItem("bravechat_user", trimmed);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "join_channel",
            channelId: serverId,
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
    <div className="flex-1 flex flex-col min-w-0 bg-ocean-dark-bg relative">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ocean-primary/20 via-ocean-dark-bg to-ocean-dark-bg" />

      {/* Header */}
      <div className="h-14 border-b border-ocean-dark-border px-6 flex items-center justify-between flex-shrink-0 z-10 bg-ocean-dark-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          {!isMe && <span className="text-ocean-light/50 font-mono text-xl">#</span>}
          <span className="text-ocean-light font-bold text-base">{channelName}</span>
          {!isMe && (
            <>
              <div className="h-4 w-px bg-ocean-dark-border mx-2" />
              <span className="text-ocean-light/60 text-sm hidden sm:inline">Kênh trò chuyện thời gian thực</span>
            </>
          )}
        </div>

        {/* Trạng thái WebSocket & Thông tin User test */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleChangeUsername}
            title="Nhấn để đổi tên test"
            className="flex items-center gap-2 px-2.5 py-1 text-xs border border-ocean-dark-border bg-ocean-dark-surface/60 hover:bg-ocean-dark-surface hover:border-ocean-secondary/50 text-ocean-light transition-all rounded"
          >
            <span className="text-ocean-light/50">Tôi:</span>
            <span className="font-bold text-ocean-secondary">{currentUser}</span>
            <span className="text-[10px] text-ocean-light/40">✏️</span>
          </button>

          <div className="flex items-center gap-2 px-2.5 py-1 text-xs rounded border border-ocean-dark-border bg-ocean-dark-surface/40">
            {connectionStatus === "connected" && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-medium">WS Live</span>
              </>
            )}
            {connectionStatus === "connecting" && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-400 font-medium">Đang kết nối...</span>
              </>
            )}
            {connectionStatus === "disconnected" && (
              <button
                onClick={connectWebSocket}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                title="Nhấn để kết nối lại"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Mất kết nối ↺</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 z-10 custom-scrollbar">
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
              {/* Hover Actions */}
              <div className="absolute right-4 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-ocean-dark-surface border border-ocean-dark-border flex items-center shadow-lg rounded">
                <button className="p-1.5 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors" title="Thêm emoji">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div className="w-px h-3 bg-ocean-dark-border" />
                <button className="p-1.5 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors" title="Trả lời">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              </div>

              <div className="w-10 h-10 bg-ocean-dark-surface border border-ocean-dark-border flex-shrink-0 flex items-center justify-center text-ocean-secondary font-bold shadow-ocean-panel rounded">
                {msg.avatar || msg.user.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className={cn("font-bold text-sm hover:underline cursor-pointer", isCurrentUser ? "text-ocean-secondary" : "text-ocean-light")}>
                    {msg.user}
                    {isCurrentUser && <span className="ml-1.5 text-[10px] px-1 py-0.2 bg-ocean-secondary/20 text-ocean-secondary rounded">Bạn</span>}
                  </span>
                  <span className="text-ocean-light/40 text-xs">{msg.time}</span>
                </div>
                <p className="text-ocean-light/90 text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
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
        <form onSubmit={handleSendMessage} className="relative flex items-center bg-ocean-dark-surface/50 border border-ocean-dark-border focus-within:border-ocean-secondary/60 focus-within:bg-ocean-dark-surface focus-within:shadow-ocean-glow transition-all duration-300 rounded">
          <button type="button" className="pl-4 pr-3 py-3 text-ocean-light/50 hover:text-ocean-light transition-colors" title="Đính kèm tệp">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder={`Nhắn tin tới #${channelName} (Nhấn Enter để gửi)...`}
            className="flex-1 bg-transparent border-none text-ocean-light text-sm focus:outline-none py-3 px-1 placeholder:text-ocean-light/30"
          />
          
          <div className="pr-3 pl-2 py-3 flex items-center gap-2 text-ocean-light/50">
            <button
              type="submit"
              disabled={!message.trim()}
              className={cn(
                "p-1.5 rounded transition-all",
                message.trim()
                  ? "bg-ocean-primary text-white hover:bg-ocean-secondary shadow-ocean-glow cursor-pointer"
                  : "text-ocean-light/30 cursor-not-allowed"
              )}
              title="Gửi tin nhắn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
