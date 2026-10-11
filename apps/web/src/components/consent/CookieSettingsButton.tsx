/**
 * components/consent/CookieSettingsButton.tsx
 * Nút mở lại banner cookie (dùng ở footer) để người dùng đổi/rút lại sự đồng ý.
 */
"use client";

import { OPEN_COOKIE_SETTINGS_EVENT } from "./CookieBanner";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      id="footer-cookie-settings"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className="text-left text-sm text-ocean-light/70 transition-colors hover:text-ocean-secondary"
    >
      Tùy chọn cookie
    </button>
  );
}
