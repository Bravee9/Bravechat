"use client";

import React, { forwardRef } from "react";
import { MessageItem, type ChatMessage } from "./MessageItem";

interface MessageListProps {
  channelName: string;
  messages: ChatMessage[];
  currentUser: string;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ channelName, messages, currentUser }, ref) => {
    return (
      <div
        data-testid="message-list"
        className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 z-10 custom-scrollbar"
      >
        {/* Welcome Message Header */}
        <div className="my-4 pb-4 border-b border-ocean-dark-border/40 select-none">
          <div className="w-16 h-16 rounded-full bg-ocean-primary/20 border border-ocean-primary/40 flex items-center justify-center text-3xl font-extrabold text-ocean-secondary mb-3">
            #
          </div>
          <h2 className="text-2xl font-bold text-ocean-light mb-1">
            Chào mừng bạn đến với #{channelName}!
          </h2>
          <p className="text-sm text-ocean-light/60">
            Đây là sự khởi đầu của kênh #{channelName}. Hãy bắt đầu cuộc trò chuyện thú vị!
          </p>
        </div>

        {/* Danh sách tin nhắn */}
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isCurrentUser={msg.user === currentUser}
          />
        ))}

        <div ref={ref} data-testid="messages-scroll-bottom" />
      </div>
    );
  }
);

MessageList.displayName = "MessageList";
