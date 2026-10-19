"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";

export interface ChatMessage {
  id: string | number;
  avatar: string;
  user: string;
  time: string;
  content: string;
  createdAt?: string | Date;
  isHighlighted?: boolean;
  attachments?: Array<{ id: string; filename: string; contentType: string; size: number; url?: string }>;
}

interface MessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  return (
    <div
      data-testid={`chat-message-${message.id}`}
      className={cn(
        "flex gap-4 group relative rounded px-3 py-2 transition-colors",
        isCurrentUser ? "bg-ocean-primary/5 border-l-2 border-ocean-primary" : "hover:bg-ocean-dark-surface/30",
        message.isHighlighted ? "bg-ocean-primary/10 border-l-2 border-ocean-secondary" : ""
      )}
    >
      {/* Actions on hover */}
      <div className="absolute right-4 -top-3 opacity-0 group-hover:opacity-100 transition-opacity bg-ocean-dark-surface border border-ocean-dark-border flex items-center shadow-lg rounded select-none">
        <button
          type="button"
          className="p-1.5 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors"
          title="Thêm emoji"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <div className="w-px h-3 bg-ocean-dark-border" />
        <button
          type="button"
          className="p-1.5 hover:bg-ocean-primary/20 text-ocean-light/70 hover:text-ocean-light transition-colors"
          title="Trả lời"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      </div>

      <div className="w-10 h-10 rounded-full bg-ocean-dark-surface border border-ocean-dark-border flex-shrink-0 flex items-center justify-center text-ocean-secondary font-bold shadow-sm select-none">
        {message.avatar || message.user.slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1">
          <span className={cn("font-bold text-sm hover:underline cursor-pointer", isCurrentUser ? "text-ocean-secondary" : "text-ocean-light")}>
            {message.user}
            {isCurrentUser && (
              <span className="ml-1.5 text-[10px] px-1 py-0.2 bg-ocean-secondary/20 text-ocean-secondary rounded">
                Bạn
              </span>
            )}
          </span>
          <span className="text-ocean-light/40 text-xs">{message.time}</span>
        </div>
        <p className="text-ocean-light/90 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        {message.attachments?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="max-w-full rounded border border-ocean-dark-border p-2 text-xs text-ocean-secondary">
                {attachment.contentType.startsWith("image/") ? <img src={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} alt={attachment.filename} className="max-h-72 max-w-full rounded object-contain" /> : null}
                {attachment.contentType.startsWith("video/") ? <video controls preload="metadata" src={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} className="max-h-72 max-w-full rounded" /> : null}
                {attachment.contentType.startsWith("audio/") ? <audio controls preload="metadata" src={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} className="max-w-full" /> : null}
                <a href={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} target="_blank" rel="noreferrer" className="mt-1 block truncate hover:underline">{attachment.filename} · {Math.ceil(attachment.size / 1024)} KB</a>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
