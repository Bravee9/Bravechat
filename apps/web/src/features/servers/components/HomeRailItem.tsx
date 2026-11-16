"use client";

import React from "react";
import Link from "next/link";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface HomeRailItemProps {
  isActive: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}

export function HomeRailItem({ isActive, isHovered, onHover }: HomeRailItemProps) {
  return (
    <div
      className="relative group w-full flex justify-center items-center"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      data-testid="home-rail-item"
    >
      {/* Left Indicator Pill */}
      <div
        data-testid="home-rail-pill"
        className={cn(
          "absolute left-0 w-1 bg-[#087CFA] rounded-r-full transition-all duration-200 pointer-events-none",
          isActive
            ? "h-10 opacity-100"
            : isHovered
            ? "h-5 opacity-100"
            : "h-0 opacity-0"
        )}
      />

      <Tooltip content="Tin nhắn trực tiếp & Bạn bè" side="right">
        <Link
          href="/channels/@me"
          scroll={false}
          className={cn(
            "w-11 h-11 flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer relative group rounded-[8px] border",
            isActive
              ? "bg-[#214283] border-[#087CFA] text-white"
              : "bg-[#1E1F22] border-[#2B2D30] text-[#E6EDF3] hover:bg-[#2B2D30] hover:border-[#393B40]"
          )}
          aria-label="Trang chủ & Tin nhắn trực tiếp"
        >
          <img
            src="/favicon.png"
            alt="Bravechat"
            className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-105 select-none"
            data-testid="home-discord-icon"
            data-brand="bravechat"
          />
        </Link>
      </Tooltip>
    </div>
  );
}
