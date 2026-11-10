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
          "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 pointer-events-none",
          isActive
            ? "h-10 opacity-100"
            : isHovered
            ? "h-5 opacity-100"
            : "h-0 opacity-0"
        )}
      />

      <Tooltip content="Tin nhắn trực tiếp" side="right">
        <Link
          href="/channels/@me"
          className={cn(
            "w-12 h-12 flex items-center justify-center text-sm font-bold transition-all duration-300 ease-out cursor-pointer relative group",
            isActive
              ? "bg-ocean-primary text-white rounded-[16px] shadow-ocean-glow"
              : "bg-ocean-dark-surface text-ocean-light/90 rounded-[24px] hover:rounded-[16px] hover:bg-ocean-primary hover:text-white hover:shadow-ocean-glow border border-ocean-dark-border"
          )}
          aria-label="Trang chủ & Tin nhắn trực tiếp"
        >
          <img
            src="/bravemath-icon-white-128.png"
            alt="Bravemath"
            className="w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm select-none"
            data-testid="home-discord-icon"
            data-brand="bravemath"
          />
        </Link>
      </Tooltip>
    </div>
  );
}
