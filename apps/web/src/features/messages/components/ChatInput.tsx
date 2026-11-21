"use client";

import React, { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ContextNoteIcon, PlusIcon } from "@/components/ui/Icons";

interface ChatInputProps {
  value: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement & HTMLInputElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onFiles?: (files: File[]) => void;
  onInsertSnippet?: () => void;
  isUploading?: boolean;
  isSending?: boolean;
}

export function ChatInput({
  value,
  placeholder,
  onChange,
  onSubmit,
  onFiles,
  onInsertSnippet,
  isUploading = false,
  isSending = false,
}: ChatInputProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCompositionEndAtRef = useRef<number | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const nativeEvent = event.nativeEvent;
      if (nativeEvent.isComposing || nativeEvent.keyCode === 229) {
        return;
      }
      if (
        lastCompositionEndAtRef.current !== null &&
        Math.abs(nativeEvent.timeStamp - lastCompositionEndAtRef.current) < 50
      ) {
        return;
      }
      if (!value.trim() || isUploading || isSending) return;
      onSubmit(event);
    }
  };

  const handleSnippetClick = () => {
    if (onInsertSnippet) {
      onInsertSnippet();
      textareaRef.current?.focus();
      return;
    }
    textareaRef.current?.focus();
  };

  const canSend = Boolean(value.trim()) && !isUploading && !isSending;

  return (
    <div className="px-4 pb-3 pt-1 flex-shrink-0 z-10" data-testid="chat-input-container">
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
        className="relative flex flex-col bg-[#1E1F22] border border-[#393B40] focus-within:border-[#3574F0] transition-colors duration-150 rounded-[8px] px-3.5 pt-2.5 pb-2"
      >
        {/* Top Multi-line Input Area */}
        <div className="flex items-start gap-2">
          <label htmlFor={inputId} className="sr-only">
            {placeholder}
          </label>
          <textarea
            id={inputId}
            ref={textareaRef}
            rows={2}
            maxLength={2000}
            disabled={isUploading}
            value={value}
            onChange={onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
            onCompositionEnd={(event) => {
              lastCompositionEndAtRef.current = event.nativeEvent.timeStamp;
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            data-testid="chat-input-field"
            className="flex-1 bg-transparent border-none text-[#DFE1E5] text-[13.5px] leading-[1.45] focus:outline-none resize-none placeholder:text-[#6F737A] custom-scrollbar"
          />
          <button
            type="button"
            onClick={handleSnippetClick}
            disabled={isUploading}
            data-testid="context-snippet-btn"
            title="Chèn đoạn mã (Code Block)"
            aria-label="Chèn đoạn mã"
            className="w-6 h-6 rounded-[4px] text-[#6F737A] hover:text-[#DFE1E5] hover:bg-[#2B2D30] flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
          >
            <ContextNoteIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Action Toolbar inside Composer (Reference Image 3) */}
        <div className="flex items-center justify-between pt-1.5 mt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
              className="w-7 h-7 rounded-[6px] text-[#A8A8B0] hover:text-white hover:bg-[#2B2D30] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              title={isUploading ? "Đang tải tệp..." : "Đính kèm tệp"}
              aria-label={isUploading ? "Đang tải tệp" : "Đính kèm tệp"}
              data-testid="attach-file-btn"
            >
              <PlusIcon className="w-4 h-4" />
            </button>

            {isUploading && (
              <div
                className="flex items-center gap-1.5 text-xs text-[#3574F0] font-mono font-medium"
                data-testid="uploading-indicator"
              >
                <svg aria-hidden="true" className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="hidden sm:inline">Đang tải tệp...</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSend}
            data-testid="send-message-btn"
            className={cn(
              "w-7 h-7 rounded-[6px] transition-colors flex items-center justify-center",
              canSend
                ? "bg-[#3574F0] text-white hover:bg-[#4682F5] cursor-pointer"
                : "bg-[#2B2D30] text-[#6F737A] cursor-not-allowed"
            )}
            title={isSending ? "Đang gửi..." : "Gửi tin nhắn (Enter)"}
            aria-label={isSending ? "Đang gửi" : "Gửi tin nhắn"}
          >
            {isSending ? (
              <svg aria-hidden="true" className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
                <path className="opacity-85" fill="currentColor" d="M4 12a8 8 0 018-8v3.5a4.5 4.5 0 00-4.5 4.5H4z" />
              </svg>
            ) : (
              <ArrowUpIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
