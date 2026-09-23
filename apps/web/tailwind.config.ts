import type { Config } from "tailwindcss";

/**
 * tailwind.config.ts — Ocean Swiss Minimalist Design System
 * Màu sắc theo spec: bravemath-springboot/docs/ui-ocean-design.md
 */
const config: Config = {
  // Dark mode mặc định (class-based toggle)
  darkMode: "class",

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // ─── OCEAN COLOR PALETTE ──────────────────────────────────
      colors: {
        ocean: {
          primary:       "#0D5C75",  // Biển sâu — Header, Nút bấm chính
          secondary:     "#639FAD",  // Xanh thép — Viền, icon, text phụ
          light:         "#D6E8ED",  // Xanh băng — Text dark mode, highlight
          "dark-bg":     "#051014",  // Đen biển thẳm — Body background dark
          "dark-surface":"#0A1C23",  // Nền Card/Sidebar dark
          "dark-border": "#16323D",  // Viền dark
          "light-bg":    "#F0F5F7",  // Xám trắng lạnh — Body light
          "light-surface":"#FFFFFF", // Trắng tinh — Card light
          "light-border":"#C9D8DD",  // Viền light
          "light-text":  "#081E26",  // Đen ánh lam — Text chính light
          hover:         "#0A4A5E",  // Hover state cho primary button
          "dark-hover":  "#0E2832",  // Hover state dark
        },
      },

      // ─── TYPOGRAPHY ──────────────────────────────────────────
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ─── BORDER RADIUS ───────────────────────────────────────
      // Swiss Minimalist: CHỈ dùng rounded-none (sharp corners)
      // KHÔNG dùng rounded-lg, rounded-xl
      borderRadius: {
        none: "0px",
        sm:   "2px",   // Chỉ dùng cho focus ring nếu cần
      },

      // ─── BOX SHADOW ──────────────────────────────────────────
      // Swiss Minimalist: tối giản, không shadow nặng
      boxShadow: {
        "ocean-glow": "0 0 20px rgba(13, 92, 117, 0.3)",
        "ocean-panel": "4px 0 16px rgba(5, 16, 20, 0.5)",
        none: "none",
      },

      // ─── ANIMATIONS ──────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "wave": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "typewriter": {
          "from": { width: "0" },
          "to":   { width: "100%" },
        },
        "blink-caret": {
          "from, to": { borderColor: "transparent" },
          "50%":      { borderColor: "#0D5C75" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%":      { transform: "translateY(-8px) rotate(1deg)" },
          "66%":      { transform: "translateY(4px) rotate(-1deg)" },
        },
      },
      animation: {
        "fade-in":       "fade-in 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-right":"slide-in-right 0.3s ease-out",
        "wave":          "wave 3s ease-in-out infinite",
        "shimmer":       "shimmer 2s linear infinite",
        "pulse-ring":    "pulse-ring 1.5s ease-out infinite",
        "float":         "float 6s ease-in-out infinite",
      },

      // ─── BACKDROP BLUR ───────────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },

      // ─── SPACING ─────────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },

  plugins: [],
};

export default config;
