"use client";

import React, { useState } from "react";
import type { CurrentUser } from "@discord-clone/shared";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { workspaceStore } from "@/stores/workspace.store";
import { http } from "@/services/http";

interface UserProfileBarProps {
  currentUser: CurrentUser | null;
}

export function UserProfileBar({ currentUser }: UserProfileBarProps) {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <footer
      data-testid="user-profile-bar"
      className="h-14 bg-[#051424] border-t border-ocean-dark-border px-3 flex items-center justify-between flex-shrink-0 z-20 select-none"
    >
      <button type="button" onClick={() => setSettingsOpen(true)} className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors text-left">
        <div className="relative flex-shrink-0">
          {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-ocean-primary flex items-center justify-center text-white text-xs font-bold shadow-ocean-glow">{currentUser?.displayName?.[0] || "B"}</div>}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#051424] bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <p className="text-ocean-light text-xs font-bold truncate leading-tight">
            {currentUser?.displayName || "Bravee9"}
          </p>
          <p className="text-ocean-light/40 text-[10px] truncate font-mono">
            #{currentUser?.discriminator || "0001"}
          </p>
        </div>
      </button>

      {/* Quick action buttons: Mute Mic, Deafen, Settings */}
      <div className="flex items-center gap-0.5 text-ocean-light/60">
        <Tooltip content={isMicMuted ? "Bật Mic" : "Tắt Mic"} side="top">
          <button
            type="button"
            onClick={() => setIsMicMuted((prev) => !prev)}
            data-testid="mute-mic-btn"
            className={cn(
              "p-1.5 rounded hover:bg-white/10 hover:text-ocean-light transition-colors cursor-pointer",
              isMicMuted && "text-rose-400 hover:text-rose-300"
            )}
            aria-label="Điều khiển Mic"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content={isDeafened ? "Bật Âm Thanh" : "Tắt Âm Thanh"} side="top">
          <button
            type="button"
            onClick={() => setIsDeafened((prev) => !prev)}
            data-testid="deafen-audio-btn"
            className={cn(
              "p-1.5 rounded hover:bg-white/10 hover:text-ocean-light transition-colors cursor-pointer",
              isDeafened && "text-rose-400 hover:text-rose-300"
            )}
            aria-label="Điều khiển Tai nghe"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Cài đặt người dùng" side="top">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            data-testid="user-settings-btn"
            className="p-1.5 rounded hover:bg-white/10 hover:text-ocean-light transition-colors cursor-pointer"
            aria-label="Cài đặt người dùng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </Tooltip>
        {currentUser ? <button type="button" title="Đăng xuất" aria-label="Đăng xuất" onClick={async () => { await http.post("/auth/logout").catch(() => undefined); window.location.href = "/login"; }} className="rounded p-1.5 text-ocean-light/60 hover:bg-white/10 hover:text-rose-300">⏻</button> : null}
      </div>
      {settingsOpen && currentUser ? <ProfileSettingsModal user={currentUser} onClose={() => setSettingsOpen(false)} onSaved={(user) => workspaceStore.set({ currentUser: user })} /> : null}
    </footer>
  );
}
