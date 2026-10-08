"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MOCK_MESSAGES = [
  {
    id: 1,
    avatar: "B9",
    user: "Bravee9",
    time: "Hôm nay lúc 09:41",
    content: "Xin chào! Nền tảng Bravechat đã chính thức đi vào hoạt động.",
    isHighlighted: true,
  },
  {
    id: 2,
    avatar: "SJ",
    user: "Shuji",
    time: "Hôm nay lúc 09:43",
    content: "Giao diện A này rất hợp với phong cách Swiss Minimalist. Vuông vức và sạch sẽ.",
    isHighlighted: false,
  },
  {
    id: 3,
    avatar: "CH",
    user: "Châu",
    time: "Hôm nay lúc 09:44",
    content: "Mình thích cách phân bổ 3 cột, dễ quản lý server và kênh.",
    isHighlighted: false,
  },
];

export function ChatArea() {
  const params = useParams();
  const serverId = decodeURIComponent((params.serverId as string) || "@me");
  
  const isMe = serverId === "@me";
  const channelName = isMe ? "Trang chủ" : "general";

  const [message, setMessage] = useState("");

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-ocean-dark-bg relative">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ocean-primary/20 via-ocean-dark-bg to-ocean-dark-bg" />

      {/* Header */}
      <div className="h-14 border-b border-ocean-dark-border px-6 flex items-center gap-4 flex-shrink-0 z-10 bg-ocean-dark-bg/80 backdrop-blur-md">
        {!isMe && <span className="text-ocean-light/50 font-mono text-xl">#</span>}
        <span className="text-ocean-light font-bold text-base">{channelName}</span>
        {!isMe && (
          <>
            <div className="h-4 w-px bg-ocean-dark-border mx-2" />
            <span className="text-ocean-light/60 text-sm">Kênh trò chuyện chính</span>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 z-10 custom-scrollbar">
        {MOCK_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-4 group relative",
              msg.isHighlighted ? "bg-ocean-primary/5 -mx-6 px-6 py-2 border-l-2 border-ocean-primary" : ""
            )}
          >
            {/* Hover Actions */}
            <div className="absolute right-6 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-ocean-dark-surface border border-ocean-dark-border flex items-center shadow-lg">
              <button className="p-2 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors" title="Thêm emoji">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className="w-px h-4 bg-ocean-dark-border" />
              <button className="p-2 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors" title="Trả lời">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </div>

            <div className="w-10 h-10 bg-ocean-dark-surface border border-ocean-dark-border flex-shrink-0 flex items-center justify-center text-ocean-secondary font-bold shadow-ocean-panel">
              {msg.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-ocean-light font-bold hover:underline cursor-pointer">{msg.user}</span>
                <span className="text-ocean-light/50 text-xs">{msg.time}</span>
              </div>
              <p className="text-ocean-light/90 text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 flex-shrink-0 z-10">
        <div className="relative flex items-center bg-ocean-dark-surface/50 border border-ocean-dark-border focus-within:border-ocean-secondary/60 focus-within:bg-ocean-dark-surface focus-within:shadow-ocean-glow transition-all duration-300">
          <button className="pl-4 pr-3 py-3 text-ocean-light/50 hover:text-ocean-light transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Nhắn tin tới ${isMe ? "Trang chủ" : "#general"}`}
            className="flex-1 bg-transparent border-none text-ocean-light text-sm focus:outline-none py-3 px-1 placeholder:text-ocean-light/30"
          />
          
          <div className="pr-4 pl-2 py-3 flex items-center gap-3 text-ocean-light/50">
            <button className="hover:text-ocean-light transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="hover:text-ocean-light transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
