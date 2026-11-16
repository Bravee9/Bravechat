"use client";

import React from "react";

/**
 * JetBrains Dark subtle grid background — replaces legacy blue ocean canvas
 */
export function OceanBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 bg-[#0B0B0D]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 80% 12%, rgba(8, 124, 250, 0.08) 0%, rgba(107, 87, 255, 0.04) 28%, transparent 60%), linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 64px 64px, 64px 64px",
      }}
    />
  );
}
