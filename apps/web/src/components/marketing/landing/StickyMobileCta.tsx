/**
 * components/landing/StickyMobileCta.tsx
 * Thanh CTA dính đáy màn hình — chỉ trên mobile, hiện sau khi cuộn qua hero.
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function StickyMobileCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cta-register");
    if (!hero || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    // Hiện khi nút CTA trong hero đã ra khỏi khung nhìn
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div
      id="sticky-mobile-cta"
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-ocean-dark-border bg-ocean-dark-bg/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "translate-y-full"
      )}
    >
      <Link
        href="/register"
        id="sticky-cta-register"
        tabIndex={show ? 0 : -1}
        className="btn-primary block w-full py-3.5 text-center text-xs"
      >
        Tham gia miễn phí
      </Link>
    </div>
  );
}
