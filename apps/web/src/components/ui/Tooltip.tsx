"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  className?: string;
  delayMs?: number;
}

export function Tooltip({
  content,
  children,
  side = "right",
  className,
  delayMs = 100,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-md shadow-2xl transition-all duration-150 animate-fade-in",
            "bg-[#0a233a] text-[#EAF2F8] border border-[#173B5C]/80 shadow-[0_8px_24px_rgba(3,10,13,0.8)] backdrop-blur-md",
            side === "right" && "left-[calc(100%+12px)] top-1/2 -translate-y-1/2",
            side === "left" && "right-[calc(100%+12px)] top-1/2 -translate-y-1/2",
            side === "top" && "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
            side === "bottom" && "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
            className
          )}
        >
          {/* Arrow */}
          {side === "right" && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#0a233a]" />
          )}
          {side === "left" && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-l-[#0a233a]" />
          )}
          {side === "top" && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#0a233a]" />
          )}
          {side === "bottom" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-[#0a233a]" />
          )}

          {content}
        </div>
      )}
    </div>
  );
}
