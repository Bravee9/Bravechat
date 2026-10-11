/**
 * components/consent/Analytics.tsx
 * Google Analytics 4 — chỉ nạp SAU KHI người dùng đồng ý cookie phân tích.
 * Cần NEXT_PUBLIC_GA_ID (G-XXXXXXXXXX); để trống thì không nạp gì.
 */
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CONSENT_EVENT, CONSENT_STORAGE_KEY, GA_MEASUREMENT_ID } from "@/lib/site";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window.gtag) return;
    const query = searchParams?.toString();
    window.gtag("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    try {
      setGranted(window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted");
    } catch {
      /* mặc định: chưa đồng ý */
    }
    const onChange = (e: Event) =>
      setGranted((e as CustomEvent<string>).detail === "granted");
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!GA_MEASUREMENT_ID || !granted) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false, anonymize_ip: true });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
