"use client";

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageItem, type ChatMessage, type MessageActions } from "./MessageItem";

interface MessageListProps extends MessageActions {
  channelName: string;
  isMe?: boolean;
  messages: ChatMessage[];
  pendingMessages?: ChatMessage[];
  currentUser: string;
  onLoadOlder?: () => void;
  hasOlder?: boolean;
  isLoadingOlder?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ channelName, isMe = false, messages, pendingMessages = [], currentUser, onLoadOlder, hasOlder, isLoadingOlder, ...actions }, ref) => {
    const allMessages = useMemo(
      () => (pendingMessages.length ? [...messages, ...pendingMessages] : messages),
      [messages, pendingMessages]
    );
    const listRef = useRef<HTMLDivElement>(null);
    const rowObservers = useRef(new Map<string | number, ResizeObserver>());
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [rowHeights, setRowHeights] = useState<Map<string | number, number>>(() => new Map());
    const estimatedRowHeight = 64;
    const rowOffsets = useMemo(() => {
      let offset = 0;
      return allMessages.map((message) => {
        const row = { top: offset, height: rowHeights.get(message.id) ?? estimatedRowHeight };
        offset += row.height + 8;
        return row;
      });
    }, [allMessages, estimatedRowHeight, rowHeights]);
    const lastRow = rowOffsets[rowOffsets.length - 1];
    const totalHeight = lastRow ? lastRow.top + lastRow.height + 8 : 0;
    const headerHeight = 180 + (hasOlder ? 40 : 0);
    const visibleStart = Math.max(0, scrollTop - headerHeight - 500);
    const visibleEnd = scrollTop + viewportHeight + 500;
    const firstMatch = rowOffsets.findIndex((row) => row.top + row.height >= visibleStart);
    const firstVisible = firstMatch < 0 ? allMessages.length : firstMatch;
    const lastVisible = rowOffsets.findIndex((row) => row.top > visibleEnd);
    const visibleMessages = allMessages.slice(firstVisible, lastVisible < 0 ? allMessages.length : lastVisible);

    useEffect(() => {
      const element = listRef.current;
      if (!element) return;
      const updateViewport = () => setViewportHeight(element.clientHeight);
      updateViewport();
      const observer = new ResizeObserver(updateViewport);
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const setRowElement = useCallback((id: string | number, element: HTMLDivElement | null) => {
      rowObservers.current.get(id)?.disconnect();
      rowObservers.current.delete(id);
      if (!element) return;
      const syncHeight = (nextHeight: number) => {
        if (nextHeight <= 0) return;
        setRowHeights((heights) => {
          if (Math.abs((heights.get(id) ?? estimatedRowHeight) - nextHeight) <= 1) return heights;
          const next = new Map(heights);
          next.set(id, nextHeight);
          return next;
        });
      };
      syncHeight(element.getBoundingClientRect().height);
      const observer = new ResizeObserver(([entry]) => {
        syncHeight(entry.contentRect.height);
      });
      observer.observe(element);
      rowObservers.current.set(id, observer);
    }, []);

    return (
      <div
        ref={listRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        data-testid="message-list"
        className="flex-1 overflow-y-auto z-10 custom-scrollbar"
      >
        {/* Welcome Message Header */}
        <div className="chat-welcome my-3 p-5 rounded-[6px] bg-[#18181B] border border-[#2B2D30] select-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="chat-welcome-icon w-9 h-9 rounded-[6px] bg-[#214283]/60 border border-[#087CFA]/50 flex items-center justify-center text-lg font-mono font-bold text-[#07C3F2]">
              {isMe ? "@" : "#"}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isMe
                  ? `Cuộc trò chuyện với ${channelName}`
                  : `Chào mừng bạn đến với #${channelName}!`}
              </h2>
              <p className="text-xs text-[#A8A8B0] mt-0.5">
                {isMe
                  ? `Đây là phần đầu lịch sử tin nhắn trực tiếp với ${channelName}.`
                  : `Đây là điểm bắt đầu của kênh #${channelName}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Danh sách tin nhắn */}
        {hasOlder && (
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={isLoadingOlder}
            className="self-center rounded px-3 py-1 text-xs text-ocean-light/60 hover:bg-white/5 disabled:opacity-40"
          >
            {isLoadingOlder ? "Đang tải tin cũ..." : "Tải tin nhắn cũ hơn"}
          </button>
        )}
        <div className="relative" style={{ height: totalHeight }}>
          {visibleMessages.map((msg, index) => {
            const messageIndex = firstVisible + index;
            const row = rowOffsets[messageIndex];
            return (
              <div
                key={msg.id}
                className="absolute left-0 right-0"
                style={{ top: row.top }}
                ref={(element) => setRowElement(msg.id, element)}
              >
                <MessageItem {...actions} message={msg} isCurrentUser={actions.currentUserId ? msg.author?.id === actions.currentUserId : msg.user === currentUser} />
              </div>
            );
          })}
        </div>

        <div ref={ref} data-testid="messages-scroll-bottom" />
      </div>
    );
  }
);

MessageList.displayName = "MessageList";
