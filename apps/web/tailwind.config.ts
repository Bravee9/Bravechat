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
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      // ─── OCEAN COLOR PALETTE (Xanh dương hàn lâm, chống mỏi mắt) ───
      // Màu phụ sáng hơn để chữ/icon tách rõ khỏi nền navy.
      //            OceanBlueLightBg EAF2F8 · OceanBlueDark 0E3D60 · OceanBlueLightText 0A233A
      // Nền tối là navy (không đen tuyền) để giảm chói; chữ là EAF2F8 thay vì trắng.
      colors: {
        ocean: {
          primary:       "#1A659E",  // OceanBluePrimary — nút chính, nhấn
          secondary:     "#86B8DE",  // Xanh sáng dịu — chữ phụ, viền, icon
          light:         "#EAF2F8",  // OceanBlueLightBg — chữ trên nền tối
          "dark-bg":     "#071A2C",  // Navy thẫm (dẫn xuất từ 0A233A) — nền body tối
          "dark-surface":"#0A233A",  // OceanBlueLightText — nền card/sidebar tối
          "dark-border": "#173B5C",  // Viền tối
          "light-bg":    "#EAF2F8",  // OceanBlueLightBg — nền body sáng
          "light-surface":"#FFFFFF", // Card sáng
          "light-border":"#C5D9EA",  // Viền sáng
          "light-text":  "#0A233A",  // OceanBlueLightText — chữ chính nền sáng
          hover:         "#15568A",  // Hover của primary
          "dark-hover":  "#0F2D4A",  // Hover trên nền tối
          deep:          "#0E3D60",  // OceanBlueDark — mảng tối, gradient
        },
      },

      // ─── TYPOGRAPHY ──────────────────────────────────────────
      fontFamily: {
        sans:  ["Be Vietnam Pro", "Inter", "system-ui", "sans-serif"],
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
        "ocean-glow": "0 0 20px rgba(26, 101, 158, 0.3)",
        "ocean-panel": "4px 0 16px rgba(7, 26, 44, 0.5)",
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
          "50%":      { borderColor: "#1A659E" },
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
