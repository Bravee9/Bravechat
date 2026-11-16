"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface RailActionItemProps {
  id: string;
  tooltip: string;
  ariaLabel: string;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick?: () => void;
  variant?: "emerald" | "ocean";
  children: React.ReactNode;
}

export function RailActionItem({
  id,
  tooltip,
  ariaLabel,
  isHovered,
  onHover,
  onClick,
  variant = "ocean",
  children,
}: RailActionItemProps) {
  return (
    <div
      className="relative group w-full flex justify-center items-center shrink-0"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      data-testid={`rail-action-${id}`}
    >
      {/* Indicator Pill */}
      <div
        className={cn(
          "absolute left-0 w-1 bg-[#087CFA] rounded-r-full transition-all duration-200 pointer-events-none",
          isHovered ? "h-5 opacity-100" : "h-0 opacity-0"
        )}
      />

      <Tooltip content={tooltip} side="right">
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "w-11 h-11 flex items-center justify-center bg-[#1E1F22] border border-[#2B2D30] rounded-[8px] transition-all duration-200 cursor-pointer group",
            variant === "emerald"
              ? "text-[#21D789] hover:bg-[#21D789]/15 hover:border-[#21D789]"
              : "text-[#07C3F2] hover:bg-[#087CFA]/20 hover:border-[#087CFA]"
          )}
          aria-label={ariaLabel}
        >
          {children}
        </button>
      </Tooltip>
    </div>
  );
}
