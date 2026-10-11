/**
 * lib/site.ts
 * Cấu hình site dùng chung cho SEO (metadataBase, sitemap, robots, analytics).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bravechat.app"
).replace(/\/$/, "");

export const SITE_NAME = "Bravechat";

export const SITE_DESCRIPTION =
  "Bravechat là nền tảng giao tiếp thời gian thực cho cộng đồng, nhóm và bạn bè. Nhắn tin, giọng nói, video — tất cả trong một nơi.";

/** Mã đo lường Google Analytics 4 (G-XXXXXXXXXX). Để trống = tắt analytics. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

/** Khoá lưu lựa chọn cookie trong localStorage. */
export const CONSENT_STORAGE_KEY = "bravechat-cookie-consent";
export const CONSENT_EVENT = "bravechat:consent-change";

export type ConsentValue = "granted" | "denied";
