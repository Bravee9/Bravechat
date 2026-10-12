"use client";

import React from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <div
      data-testid="typing-indicator"
      className="px-6 pb-2 text-xs text-ocean-secondary flex items-center gap-2 z-10 animate-fade-in select-none"
    >
      <span className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-ocean-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-ocean-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-ocean-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
      <span>{typingUsers.join(", ")} đang gõ tin nhắn...</span>
    </div>
  );
}
