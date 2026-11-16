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
  const [lightboxImg, setLightboxImg] = useState<{ url: string; filename: string } | null>(null);
  const react = (emoji: string) => { onReaction?.(message, emoji, Boolean(message.reactions?.find((reaction) => reaction.emoji === emoji)?.userIds.includes(currentUserId ?? ""))); setPicker(false); };
  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
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
      {!!message.attachments?.length && <div className="mt-2 flex flex-wrap gap-2.5">{message.attachments.map((attachment) => {
        const fileUrl = attachment.url ?? `${env.apiUrl}/uploads/${attachment.id}/url`;
        const isImg = attachment.contentType.startsWith("image/");
        const isVid = attachment.contentType.startsWith("video/");
        const isAud = attachment.contentType.startsWith("audio/");
        return (
          <div key={attachment.id} className="max-w-md rounded-lg border border-ocean-dark-border bg-ocean-dark-surface/60 overflow-hidden shadow-sm">
            {isImg && (
              <div className="cursor-pointer group/img relative overflow-hidden bg-black/20" onClick={() => setLightboxImg({ url: fileUrl, filename: attachment.filename })}>
                <img src={fileUrl} alt={attachment.filename} className="max-h-72 max-w-full object-contain rounded-t transition-transform duration-200 group-hover/img:scale-[1.02]" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-xs text-white bg-black/40 font-medium">
                  Phóng to ảnh
                </div>
              </div>
            )}
            {isVid && <video controls preload="metadata" src={fileUrl} className="max-h-72 max-w-full rounded-t" />}
            {isAud && <div className="p-3"><audio controls preload="metadata" src={fileUrl} className="w-full" /></div>}
            <div className="p-2.5 flex items-center justify-between gap-3 text-xs border-t border-ocean-dark-border/40">
              <span className="truncate text-ocean-light/80 font-medium" title={attachment.filename}>
                {attachment.filename}
              </span>
              <a href={fileUrl} download={attachment.filename} target="_blank" rel="noreferrer" className="flex-shrink-0 text-ocean-secondary hover:underline flex items-center gap-1 font-semibold">
                <span>Tải về</span>
                {attachment.size > 0 && <span className="text-ocean-light/40">({formatSize(attachment.size)})</span>}
              </a>
            </div>
          </div>
        );
      })}</div>}
      {!!message.reactions?.length && <div className="mt-2 flex flex-wrap gap-1">{message.reactions.map((reaction) => <button key={reaction.emoji} type="button" aria-pressed={reaction.userIds.includes(currentUserId ?? "")} onClick={() => react(reaction.emoji)} className={cn("rounded border px-2 py-1 text-xs", reaction.userIds.includes(currentUserId ?? "") ? "border-ocean-secondary bg-ocean-primary/25" : "border-ocean-dark-border")}>{reaction.emoji} {reaction.count}</button>)}</div>}
    </div>

    {/* Lightbox Modal */}
    {lightboxImg && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setLightboxImg(null)}>
        <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setLightboxImg(null)} className="absolute -top-10 right-0 text-white/80 hover:text-white text-lg font-bold p-1">
            ✕ Đóng
          </button>
          <img src={lightboxImg.url} alt={lightboxImg.filename} className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl" />
          <div className="mt-2 flex items-center gap-4 text-xs text-white/70">
            <span>{lightboxImg.filename}</span>
            <a href={lightboxImg.url} download={lightboxImg.filename} target="_blank" rel="noreferrer" className="text-ocean-secondary underline font-medium">
              Mở ảnh gốc
            </a>
          </div>
        </div>
      </div>
    )}
  </div>;
}
