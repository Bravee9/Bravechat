/**
 * components/consent/CookieBanner.tsx
 * Banner đồng ý cookie — lưu lựa chọn vào localStorage, phát sự kiện cho Analytics.
 * Có thể mở lại từ footer qua sự kiện OPEN_COOKIE_SETTINGS_EVENT.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  type ConsentValue,
} from "@/lib/site";

export const OPEN_COOKIE_SETTINGS_EVENT = "bravechat:open-cookie-settings";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      /* localStorage bị chặn — vẫn hiện banner */
    }
    if (stored !== "granted" && stored !== "denied") setVisible(true);

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const choose = useCallback((value: ConsentValue) => {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch {
      /* bỏ qua */
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-ocean-dark-border bg-ocean-dark-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-fade-in sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-md sm:border sm:p-5"
    >
      <h2
        id="cookie-banner-title"
        className="text-sm font-black uppercase tracking-widest text-ocean-light"
      >
        Cookie &amp; quyền riêng tư
      </h2>
      <p
        id="cookie-banner-desc"
        className="mt-2 text-sm leading-relaxed text-ocean-light/80"
      >
        Chúng tôi dùng cookie cần thiết để đăng nhập, và cookie phân tích ẩn danh
        (nếu bạn đồng ý) để cải thiện dịch vụ. Xem{" "}
        <Link href="/cookies" className="underline">
          Chính sách Cookie
        </Link>{" "}
        và{" "}
        <Link href="/privacy" className="underline">
          Chính sách bảo mật
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          id="cookie-accept"
          type="button"
          onClick={() => choose("granted")}
          className="btn-primary flex-1 px-4 py-3 text-xs"
        >
          Chấp nhận tất cả
        </button>
        <button
          id="cookie-decline"
          type="button"
          onClick={() => choose("denied")}
          className="btn-secondary flex-1 px-4 py-3 text-xs"
        >
          Chỉ cần thiết
        </button>
      </div>
    </div>
  );
}
