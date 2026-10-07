/**
 * components/landing/HeroSection.tsx
 * Landing page hero — Discord-inspired layout with Ocean theme
 */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Animated typing effect for taglines
const TAGLINES = [
  "Nơi mọi cuộc trò chuyện bắt đầu.",
  "Kết nối cộng đồng của bạn.",
  "Âm thanh, hình ảnh, văn bản — tất cả.",
  "Giao tiếp không giới hạn.",
];

export function HeroSection() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter effect
  useEffect(() => {
    const current = TAGLINES[taglineIndex];

    if (!isDeleting && displayed === current) {
      timerRef.current = setTimeout(() => setIsDeleting(true), 2200);
      return;
    }

    if (isDeleting && displayed === "") {
      setIsDeleting(false);
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
      return;
    }

    const speed = isDeleting ? 35 : 65;
    timerRef.current = setTimeout(() => {
      setDisplayed((prev) =>
        isDeleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1)
      );
    }, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayed, isDeleting, taglineIndex]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16"
    >
      {/* Section tag */}
      <div className="section-tag animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block animate-pulse" />
        Phiên bản Beta · Đang phát triển
      </div>

      {/* Main heading */}
      <h1
        className="text-center font-black max-w-5xl mx-auto animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        <span className="block text-5xl md:text-7xl lg:text-8xl leading-normal tracking-tighter text-ocean-light pt-2 pb-1">
          GIAO TIẾP
        </span>
        <span className="block text-5xl md:text-7xl lg:text-8xl leading-normal tracking-tighter text-gradient-ocean mb-2">
          KHÔNG GIỚI HẠN
        </span>
        {/* Typewriter line */}
        <span className="block text-lg md:text-2xl font-light tracking-widest text-ocean-secondary mt-6 h-8">
          {displayed}
          <span className="animate-pulse text-ocean-primary">|</span>
        </span>
      </h1>

      {/* Description */}
      <p
        className="mt-8 text-center text-ocean-light/90 text-base md:text-lg max-w-2xl leading-relaxed animate-fade-in"
        style={{ animationDelay: "0.4s" }}
      >
        Khởi tạo máy chủ, kết nối thành viên, trao đổi qua tin nhắn, giọng nói và video.
        Bravechat mang lại trải nghiệm giao tiếp liền mạch, bảo mật và không giới hạn.
      </p>

      {/* CTA Buttons */}
      <div
        className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in"
        style={{ animationDelay: "0.5s" }}
      >
        <Link
          href="/register"
          id="hero-cta-register"
          className="btn-primary text-sm px-10 py-4 text-center min-w-48"
        >
          Tham gia miễn phí
        </Link>
        <Link
          href="/login"
          id="hero-cta-login"
          className="btn-secondary text-sm px-10 py-4 text-center min-w-48"
        >
          Đăng nhập
        </Link>
      </div>

      {/* Stats bar */}
      <div
        className="mt-16 flex flex-col sm:flex-row gap-0 border border-ocean-dark-border animate-fade-in"
        style={{ animationDelay: "0.7s" }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`px-10 py-5 text-center ${
              i < STATS.length - 1
                ? "border-b sm:border-b-0 sm:border-r border-ocean-dark-border"
                : ""
            }`}
          >
            <div className="text-2xl md:text-3xl font-black text-ocean-light tracking-tight">
              {stat.value}
            </div>
            <div className="text-ocean-light/70 text-xs font-bold uppercase tracking-widest mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>


      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-ocean-light/70 text-xs font-bold uppercase tracking-widest">
          Cuộn xuống
        </span>
        <svg
          className="w-4 h-4 text-ocean-light/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="square"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}

const STATS = [
  { value: "10M+", label: "Người dùng" },
  { value: "500K+", label: "Server" },
  { value: "99.9%", label: "Uptime" },
  { value: "50ms", label: "Độ trễ" },
];

