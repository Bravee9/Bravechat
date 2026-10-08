"use client";

import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MOCK_CHANNELS = [
  { id: "general", name: "general", type: "text" },
  { id: "announcements", name: "announcements", type: "text" },
  { id: "voice", name: "Lounge", type: "voice" },
];

const MOCK_DMS = [
  { id: "1", name: "Shuji", status: "online" },
  { id: "2", name: "Châu", status: "idle" },
];

export function ChannelSidebar() {
  const params = useParams();
  const serverId = decodeURIComponent((params.serverId as string) || "@me");

  const isMe = serverId === "@me";

  return (
    <div className="w-60 bg-ocean-dark-surface border-r border-ocean-dark-border flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-ocean-dark-border px-4 flex items-center justify-between shadow-sm z-10">
        <span className="text-ocean-light text-sm font-bold truncate">
          {isMe ? "Direct Messages" : "Bravechat HQ"}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar">
        {isMe ? (
          <>
            <p className="text-ocean-light/60 text-xs font-bold uppercase tracking-widest px-2 py-1 mb-1">
              Bạn bè
            </p>
            {MOCK_DMS.map((dm) => (
              <Link
                key={dm.id}
                href={`/channels/@me/${dm.id}`}
                className="flex items-center gap-3 px-2 py-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors group cursor-pointer"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-ocean-primary flex items-center justify-center text-white text-xs font-bold">
                    {dm.name.charAt(0)}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-3 h-3 border-2 border-ocean-dark-surface",
                    dm.status === "online" ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                </div>
                <span className="text-ocean-light/90 text-sm font-medium group-hover:text-ocean-light truncate">
                  {dm.name}
                </span>
              </Link>
            ))}
          </>
        ) : (
          <>
            <p className="text-ocean-light/60 text-xs font-bold uppercase tracking-widest px-2 py-1 mb-1">
              Text Channels
            </p>
            {MOCK_CHANNELS.filter(c => c.type === "text").map((ch) => (
              <Link
                key={ch.id}
                href={`/channels/${serverId}/${ch.id}`}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 mb-0.5 transition-colors border border-transparent group",
                  ch.id === "general" ? "bg-ocean-primary/20 border-ocean-primary/30 text-ocean-light" : "text-ocean-light/70 hover:bg-white/5 hover:border-white/10 hover:text-ocean-light"
                )}
              >
                <span className="text-ocean-light/50 font-mono text-lg leading-none mb-0.5">#</span>
                <span className="text-sm font-medium truncate">{ch.name}</span>
              </Link>
            ))}

            <p className="text-ocean-light/60 text-xs font-bold uppercase tracking-widest px-2 py-1 mt-4 mb-1">
              Voice Channels
            </p>
            {MOCK_CHANNELS.filter(c => c.type === "voice").map((ch) => (
              <Link
                key={ch.id}
                href={`/channels/${serverId}/${ch.id}`}
                className="flex items-center gap-2 px-2 py-1.5 mb-0.5 text-ocean-light/70 hover:bg-white/5 border border-transparent hover:border-white/10 hover:text-ocean-light transition-colors group"
              >
                <svg className="w-4 h-4 text-ocean-light/50 group-hover:text-ocean-light/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span className="text-sm font-medium truncate">{ch.name}</span>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* User Bar */}
      <div className="h-16 bg-ocean-dark-bg border-t border-ocean-dark-border px-3 flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 bg-ocean-primary flex items-center justify-center text-white text-sm font-bold shadow-ocean-glow">
            B9
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-ocean-dark-bg bg-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-ocean-light text-sm font-bold truncate">Bravee9</p>
          <p className="text-ocean-light/50 text-xs truncate font-mono">#0001</p>
        </div>
      </div>
    </div>
  );
}
