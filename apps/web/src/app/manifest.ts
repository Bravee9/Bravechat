/**
 * app/manifest.ts
 * Web app manifest (một phần của bộ favicon)
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bravechat",
    short_name: "Bravechat",
    description: "Nền tảng giao tiếp thời gian thực — nhắn tin, giọng nói, video.",
    start_url: "/",
    display: "standalone",
    background_color: "#071A2C",
    theme_color: "#071A2C",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
