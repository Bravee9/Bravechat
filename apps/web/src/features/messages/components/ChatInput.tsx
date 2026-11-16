"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onFiles?: (files: File[]) => void;
  isUploading?: boolean;
  isSending?: boolean;
}

export function ChatInput({
  value,
  placeholder,
  onChange,
  onSubmit,
  onFiles,
  isUploading = false,
  isSending = false,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="px-6 pb-5 pt-2 flex-shrink-0 z-10" data-testid="chat-input-container">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        data-testid="attachment-file-input"
        accept="image/*,video/*,audio/*,.pdf,.txt,.zip"
        onChange={(event) => {
          if (event.target.files?.length) onFiles?.(Array.from(event.target.files));
          event.target.value = "";
        }}
      />
      <form
        onSubmit={onSubmit}
        className="relative flex items-center bg-[#18181B] border border-[#087CFA]/60 focus-within:border-[#087CFA] focus-within:ring-1 focus-within:ring-[#087CFA]/40 transition-all duration-200 rounded-[6px]"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
          className="pl-3.5 pr-2.5 py-3 text-[#7D7D7D] hover:text-white transition-colors cursor-pointer"
          title={isUploading ? "Đang tải tệp..." : "Đính kèm tệp"}
          data-testid="attach-file-btn"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <input
          type="text"
          maxLength={2000}
          disabled={isUploading || isSending}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          data-testid="chat-input-field"
          className="flex-1 bg-transparent border-none text-[#E6EDF3] text-sm focus:outline-none py-3 px-1.5 placeholder:text-[#7D7D7D]"
        />

        {isUploading && (
          <div
            className="flex items-center gap-1.5 pr-2 text-xs text-[#07C3F2] font-mono font-medium animate-pulse"
            data-testid="uploading-indicator"
          >
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="hidden sm:inline">Đang tải tệp...</span>
          </div>
        )}

        <div className="pr-2.5 pl-2 py-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={!value.trim() || isUploading || isSending}
            data-testid="send-message-btn"
            className={cn(
              "px-2.5 py-1.5 rounded-[4px] text-xs font-mono font-semibold transition-all flex items-center gap-1",
              value.trim()
                ? "bg-[#087CFA] text-white hover:bg-[#07C3F2] hover:text-[#0B0B0D] cursor-pointer"
                : "bg-[#2B2D30]/50 text-[#7D7D7D] cursor-not-allowed"
            )}
            title="Gửi tin nhắn"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
