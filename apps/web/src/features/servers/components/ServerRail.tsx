"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MOCK_SERVERS = [
  { id: "@me", name: "Trang chủ", icon: "Home" },
  { id: "1", name: "Bravechat HQ", icon: "B" },
  { id: "2", name: "Design Team", icon: "D" },
];

export function ServerSidebar() {
  const pathname = usePathname();
  const currentServerId = pathname.split("/")[2] || "@me";

  return (
    <div className="w-16 bg-[#030a0d] border-r border-ocean-dark-border flex flex-col items-center py-3 gap-3 flex-shrink-0 z-20 shadow-2xl">
      {MOCK_SERVERS.map((server) => {
        const isActive = currentServerId === server.id || (server.id === "@me" && currentServerId === "%40me");
        const isHome = server.id === "@me";

        return (
          <div key={server.id} className="relative group w-full flex justify-center">
            {/* Active indicator */}
            <div
              className={cn(
                "absolute left-0 w-1 bg-ocean-light transition-all duration-300",
                isActive ? "h-12 top-0" : "h-2 top-5 opacity-0 group-hover:opacity-100 group-hover:h-6 group-hover:top-3"
              )}
            />

            <Link
              href={`/channels/${server.id}`}
              className={cn(
                "w-12 h-12 flex items-center justify-center text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-ocean-primary text-white shadow-ocean-glow"
                  : "bg-ocean-dark-surface text-ocean-light hover:bg-ocean-primary hover:text-white hover:shadow-ocean-glow border border-ocean-dark-border"
              )}
              title={server.name}
            >
              {isHome ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              ) : (
                server.icon
              )}
            </Link>
          </div>
        );
      })}

      <div className="w-8 h-px bg-ocean-dark-border my-1" />

      {/* Add Server Button */}
      <button className="w-12 h-12 border border-dashed border-ocean-dark-border flex items-center justify-center text-ocean-light/60 hover:border-ocean-secondary hover:text-ocean-secondary transition-all cursor-pointer text-xl group hover:shadow-ocean-glow">
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
