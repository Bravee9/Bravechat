"use client";

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageItem, type ChatMessage } from "./MessageItem";

interface MessageListProps {
  channelName: string;
  messages: ChatMessage[];
  currentUser: string;
  onLoadOlder?: () => void;
  hasOlder?: boolean;
  isLoadingOlder?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ channelName, messages, currentUser, onLoadOlder, hasOlder, isLoadingOlder }, ref) => {
    const listRef = useRef<HTMLDivElement>(null);
    const rowObservers = useRef(new Map<string | number, ResizeObserver>());
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [rowHeights, setRowHeights] = useState<Map<string | number, number>>(() => new Map());
    const estimatedRowHeight = 104;
    const rowOffsets = useMemo(() => {
      let offset = 0;
      return messages.map((message) => {
        const row = { top: offset, height: rowHeights.get(message.id) ?? estimatedRowHeight };
        offset += row.height + 16;
        return row;
      });
    }, [messages, estimatedRowHeight, rowHeights]);
    const lastRow = rowOffsets[rowOffsets.length - 1];
    const totalHeight = lastRow ? lastRow.top + lastRow.height + 16 : 0;
    const headerHeight = 180 + (hasOlder ? 40 : 0);
    const visibleStart = Math.max(0, scrollTop - headerHeight - 500);
    const visibleEnd = scrollTop + viewportHeight + 500;
    const firstMatch = rowOffsets.findIndex((row) => row.top + row.height >= visibleStart);
    const firstVisible = firstMatch < 0 ? messages.length : firstMatch;
    const lastVisible = rowOffsets.findIndex((row) => row.top > visibleEnd);
    const visibleMessages = messages.slice(firstVisible, lastVisible < 0 ? messages.length : lastVisible);

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
      const observer = new ResizeObserver(([entry]) => {
        const nextHeight = entry.contentRect.height;
        setRowHeights((heights) => {
          if (Math.abs((heights.get(id) ?? estimatedRowHeight) - nextHeight) <= 1) return heights;
          const next = new Map(heights);
          next.set(id, nextHeight);
          return next;
        });
      });
      observer.observe(element);
      rowObservers.current.set(id, observer);
    }, []);

    return (
      <div
        ref={listRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        data-testid="message-list"
        className="flex-1 overflow-y-auto px-6 py-6 z-10 custom-scrollbar"
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
                <MessageItem message={msg} isCurrentUser={msg.user === currentUser} />
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
