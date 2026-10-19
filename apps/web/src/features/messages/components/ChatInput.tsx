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
}

export function ChatInput({
  value,
  placeholder,
  onChange,
  onSubmit,
  onFiles,
  isUploading = false,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="px-6 pb-6 flex-shrink-0 z-10" data-testid="chat-input-container">
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
        className="relative flex items-center bg-ocean-dark-surface/50 border border-ocean-dark-border focus-within:border-ocean-secondary/60 focus-within:bg-ocean-dark-surface focus-within:shadow-ocean-glow transition-all duration-300 rounded-lg"
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="pl-4 pr-3 py-3 text-ocean-light/50 hover:text-ocean-light transition-colors"
          title={isUploading ? "Đang tải tệp..." : "Đính kèm tệp"}
          data-testid="attach-file-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          data-testid="chat-input-field"
          className="flex-1 bg-transparent border-none text-ocean-light text-sm focus:outline-none py-3 px-1 placeholder:text-ocean-light/30"
        />

        <div className="pr-3 pl-2 py-3 flex items-center gap-2 text-ocean-light/50">
          <button
            type="submit"
          disabled={!value.trim() || isUploading}
            data-testid="send-message-btn"
            className={cn(
              "p-1.5 rounded-md transition-all",
              value.trim()
                ? "bg-ocean-primary text-white hover:bg-ocean-secondary shadow-ocean-glow cursor-pointer"
                : "text-ocean-light/30 cursor-not-allowed"
            )}
            title="Gửi tin nhắn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
