/**
 * components/ui/OceanBackground.tsx
 * Animated ocean background with SVG waves
 */
"use client";

export function OceanBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-ocean-animated" />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glowing ocean orbs */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 opacity-20"
        style={{
          background: "radial-gradient(circle, #0D5C75 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-1/3 -right-32 w-80 h-80 opacity-15"
        style={{
          background: "radial-gradient(circle, #639FAD 0%, transparent 70%)",
          animation: "float 12s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute top-2/3 left-1/3 w-64 h-64 opacity-10"
        style={{
          background: "radial-gradient(circle, #0D5C75 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite",
          animationDelay: "2s",
        }}
      />

      {/* Grid lines — Swiss minimalist structure */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 159, 173, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 159, 173, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Bottom wave SVG */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60C240 20 480 100 720 60C960 20 1200 100 1440 60V120H0V60Z"
            fill="#0A1C23"
            fillOpacity="0.4"
          />
          <path
            d="M0 80C240 40 480 110 720 80C960 40 1200 110 1440 80V120H0V80Z"
            fill="#0A1C23"
            fillOpacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
}
