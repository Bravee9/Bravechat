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
      className="relative group w-full flex justify-center items-center"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      data-testid={`rail-action-${id}`}
    >
      {/* Indicator Pill */}
      <div
        className={cn(
          "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300 pointer-events-none",
          isHovered ? "h-5 opacity-100" : "h-0 opacity-0"
        )}
      />

      <Tooltip content={tooltip} side="right">
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "w-12 h-12 flex items-center justify-center bg-ocean-dark-surface border border-ocean-dark-border rounded-[24px] hover:rounded-[16px] transition-all duration-300 shadow-sm cursor-pointer group",
            variant === "emerald"
              ? "text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500"
              : "text-ocean-secondary hover:bg-ocean-primary hover:text-white hover:border-ocean-secondary"
          )}
          aria-label={ariaLabel}
        >
          {children}
        </button>
      </Tooltip>
    </div>
  );
}
