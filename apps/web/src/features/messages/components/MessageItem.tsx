"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";

export interface ChatMessage {
  id: string | number; avatar: string; user: string; time: string; content: string;
  createdAt?: string | Date; isHighlighted?: boolean; isEdited?: boolean;
  author?: { id: string; username: string; displayName?: string | null };
  senderId?: string; receiverId?: string;
  replyTo?: { id: string; content: string; user: string } | null;
  reactions?: Array<{ emoji: string; count: number; userIds: string[] }>;
  attachments?: Array<{ id: string; filename: string; contentType: string; size: number; url?: string }>;
}
export interface MessageActions {
  onReply?: (message: ChatMessage) => void;
  onReaction?: (message: ChatMessage, emoji: string, remove: boolean) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onInspect?: (userId: string) => void;
  currentUserId?: string;
}
export function MessageItem({ message, isCurrentUser, currentUserId, onReply, onReaction, onEdit, onDelete, onInspect }: { message: ChatMessage; isCurrentUser: boolean } & MessageActions) {
  const [picker, setPicker] = useState(false);
  const react = (emoji: string) => { onReaction?.(message, emoji, Boolean(message.reactions?.find((reaction) => reaction.emoji === emoji)?.userIds.includes(currentUserId ?? ""))); setPicker(false); };
  return <div data-testid={`chat-message-${message.id}`} className={cn("message-row flex gap-4 group relative px-3 py-2 transition-colors", message.isHighlighted && "bg-ocean-primary/10 border-l-2 border-ocean-secondary")}>
    <div className="absolute right-2 -top-3 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-ocean-dark-surface border border-ocean-dark-border flex items-center shadow-lg rounded">
      <button type="button" className="p-1.5 text-xs hover:bg-white/10" title="Thêm emoji" aria-label="Thêm emoji" onClick={() => setPicker((value) => !value)}>☺</button>
      <button type="button" className="p-1.5 text-xs hover:bg-white/10" title="Trả lời" aria-label="Trả lời" onClick={() => onReply?.(message)}>↩</button>
      {isCurrentUser && onEdit && <button type="button" className="p-1.5 text-xs hover:bg-white/10" onClick={() => onEdit(message)}>Sửa</button>}
      {isCurrentUser && onDelete && <button type="button" className="p-1.5 text-xs text-rose-300 hover:bg-white/10" onClick={() => onDelete(message)}>Xóa</button>}
    </div>
    {picker && <div role="group" aria-label="Chọn emoji" className="absolute right-0 top-4 z-30 flex rounded border border-ocean-dark-border bg-ocean-dark-surface p-2 shadow-xl">{["👍", "❤️", "😂", "😮", "😢", "🎉"].map((emoji) => <button key={emoji} className="p-2 hover:bg-white/10" onClick={() => react(emoji)} aria-label={emoji}>{emoji}</button>)}<button className="p-1 text-xs" onClick={() => setPicker(false)} aria-label="Đóng emoji">✕</button></div>}
    <div className="message-avatar w-10 h-10 rounded-full bg-ocean-dark-surface border border-ocean-dark-border flex-shrink-0 flex items-center justify-center text-ocean-secondary font-bold">{message.avatar || message.user.slice(0, 2).toUpperCase()}</div>
    <div className="flex-1 min-w-0">
      {message.replyTo && <blockquote className="mb-2 truncate border-l-2 border-ocean-secondary/50 pl-2 text-xs text-ocean-light/60">↩ {message.replyTo.user}: {message.replyTo.content}</blockquote>}
      <div className="flex items-baseline gap-2"><button type="button" className={cn("message-author font-medium text-sm hover:underline")} onClick={() => { if (message.author?.id) onInspect?.(message.author.id); }}>{message.user}</button><span className="text-ocean-light/40 text-xs">{message.time}</span>{message.isEdited && <span className="text-[10px] text-ocean-light/40">đã sửa</span>}</div>
      <p className="message-content text-ocean-light/90 text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
      {!!message.attachments?.length && <div className="mt-2 flex flex-wrap gap-2">{message.attachments.map((attachment) => <div key={attachment.id} className="max-w-full rounded border border-ocean-dark-border p-2 text-xs text-ocean-secondary">
        {attachment.contentType.startsWith("image/") && <img src={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} alt={attachment.filename} className="max-h-72 max-w-full rounded object-contain" />}
        {attachment.contentType.startsWith("video/") && <video controls preload="metadata" src={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} className="max-h-72 max-w-full rounded" />}
        {attachment.contentType.startsWith("audio/") && <audio controls preload="metadata" src={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} className="max-w-full" />}
        <a href={attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`} target="_blank" rel="noreferrer" className="mt-1 block truncate hover:underline">{attachment.filename} · {Math.ceil(attachment.size / 1024)} KB</a>
      </div>)}</div>}
      {!!message.reactions?.length && <div className="mt-2 flex flex-wrap gap-1">{message.reactions.map((reaction) => <button key={reaction.emoji} type="button" aria-pressed={reaction.userIds.includes(currentUserId ?? "")} onClick={() => react(reaction.emoji)} className={cn("rounded border px-2 py-1 text-xs", reaction.userIds.includes(currentUserId ?? "") ? "border-ocean-secondary bg-ocean-primary/25" : "border-ocean-dark-border")}>{reaction.emoji} {reaction.count}</button>)}</div>}
    </div>
  </div>;
}
