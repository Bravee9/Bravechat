import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({
  href = "/",
  size = "md",
  className,
  onClick,
}: BrandLogoProps) {
  const iconSize =
    size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const textSize =
    size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  const content = (
    <>
      <img
        src="/favicon.png"
        alt="Bravechat"
        width={size === "lg" ? 40 : size === "sm" ? 28 : 32}
        height={size === "lg" ? 40 : size === "sm" ? 28 : 32}
        className={cn(iconSize, "object-contain select-none shrink-0")}
      />
      <span
        className={cn(
          textSize,
          "font-['Inter',sans-serif] font-extrabold tracking-tight leading-none select-none"
        )}
      >
        <span className="text-white">Brave</span>
        <span className="text-[#86B8DE]">chat</span>
      </span>
    </>
  );

  if (!href) {
    return (
      <div className={cn("inline-flex items-center gap-2.5", className)}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2.5 shrink-0 select-none group",
        className
      )}
    >
      {content}
    </Link>
  );
}
