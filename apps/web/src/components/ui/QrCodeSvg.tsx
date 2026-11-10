"use client";

import React, { useMemo } from "react";
import { generateQrMatrix } from "@/lib/qrcode";

interface QrCodeSvgProps {
  value: string;
  size?: number;
  showCenterLogo?: boolean;
  className?: string;
}

export function QrCodeSvg({
  value,
  size = 180,
  showCenterLogo = true,
  className = "",
}: QrCodeSvgProps) {
  const matrix = useMemo(() => generateQrMatrix(value || "https://bravechat.local"), [value]);
  const moduleCount = matrix.length;
  const quietZone = 2;
  const totalModules = moduleCount + quietZone * 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white p-2.5 rounded-xl shadow-xl select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${totalModules} ${totalModules}`}
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        aria-label="Mã QR bảo mật Bravechat"
      >
        <rect width={totalModules} height={totalModules} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((dark, c) =>
            dark ? (
              <rect
                key={`${r}-${c}`}
                x={c + quietZone}
                y={r + quietZone}
                width={1}
                height={1}
                fill="#051424"
              />
            ) : null
          )
        )}
      </svg>

      {showCenterLogo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-lg bg-[#051424] border-2 border-white shadow-md flex items-center justify-center p-1">
            <img
              src="/logo-96.png"
              alt="Bravechat"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
