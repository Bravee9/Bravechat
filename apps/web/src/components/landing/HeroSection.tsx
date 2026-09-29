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
        <span className="block text-5xl md:text-7xl lg:text-8xl leading-normal tracking-tighter text-gradient-ocean pt-1 pb-4 mb-2">
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

      {/* Mock Discord UI preview */}
      <div
        className="mt-20 w-full max-w-5xl animate-fade-in"
        style={{ animationDelay: "0.9s" }}
      >
        <AppPreview />
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

/** Mock app UI preview */
function AppPreview() {
  return (
    <div className="relative border border-ocean-dark-border overflow-hidden shadow-ocean-panel">
      {/* Title bar */}
      <div className="h-8 bg-[#030C10] border-b border-ocean-dark-border flex items-center px-4 gap-2">
        <div className="w-3 h-3 bg-ocean-dark-border" />
        <div className="w-3 h-3 bg-ocean-dark-border" />
        <div className="w-3 h-3 bg-ocean-dark-border" />
        <span className="ml-3 text-ocean-light/70 text-xs font-mono">
          bravechat.app/channels/@me
        </span>
      </div>

      {/* App layout */}
      <div className="flex h-80 md:h-96">
        {/* Server list sidebar */}
        <div className="w-14 bg-[#030C10] border-r border-ocean-dark-border flex flex-col items-center py-3 gap-3">
          {/* Home button */}
          <div className="w-10 h-10 bg-ocean-primary flex items-center justify-center group relative">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            {/* Active indicator */}
            <div className="absolute -left-1 w-1 h-8 bg-ocean-light" />
          </div>
          <div className="w-8 h-px bg-ocean-dark-border" />
          {/* Mock server icons */}
          {["G", "D", "A", "B"].map((letter, i) => (
            <div
              key={letter}
              className="w-10 h-10 bg-ocean-dark-surface border border-ocean-dark-border flex items-center justify-center text-ocean-secondary text-xs font-bold hover:bg-ocean-primary hover:text-white transition-all cursor-pointer"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {letter}
            </div>
          ))}
          {/* Add server */}
          <div className="w-10 h-10 border border-dashed border-ocean-dark-border flex items-center justify-center text-ocean-light/60 hover:border-ocean-secondary hover:text-ocean-secondary transition-all cursor-pointer mt-auto text-lg">
            +
          </div>
        </div>

        {/* Channel sidebar */}
        <div className="w-48 bg-ocean-dark-surface border-r border-ocean-dark-border flex flex-col">
          {/* Server name header */}
          <div className="h-12 border-b border-ocean-dark-border px-4 flex items-center justify-between">
            <span className="text-ocean-light text-sm font-bold truncate">
              Bravechat HQ
            </span>
            <svg className="w-4 h-4 text-ocean-light/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {/* Channels */}
          <div className="flex-1 overflow-hidden py-2 px-2">
            <p className="text-ocean-light/60 text-[10px] font-bold uppercase tracking-widest px-2 py-1">
              Text Channels
            </p>
            {["general", "announcements", "dev-talk", "media"].map((ch, i) => (
              <div
                key={ch}
                className={`sidebar-item text-xs ${i === 0 ? "sidebar-item-active" : ""}`}
              >
                <span className="text-ocean-light/70">#</span>
                {ch}
              </div>
            ))}
            <p className="text-ocean-light/60 text-[10px] font-bold uppercase tracking-widest px-2 py-1 mt-2">
              Voice Channels
            </p>
            {["Lounge", "Gaming"].map((ch) => (
              <div key={ch} className="sidebar-item text-xs">
                <svg className="w-3 h-3 text-ocean-light/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                {ch}
              </div>
            ))}
          </div>
          {/* User info bar */}
          <div className="h-14 bg-[#030C10] border-t border-ocean-dark-border px-3 flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 bg-ocean-primary flex items-center justify-center text-white text-xs font-bold">
                B9
              </div>
              <div className="badge-online absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ocean-light text-xs font-bold truncate">Bravee9</p>
              <p className="text-ocean-light/60 text-[10px] truncate">#0001</p>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-ocean-dark-bg">
          {/* Chat header */}
          <div className="h-12 border-b border-ocean-dark-border px-4 flex items-center gap-3">
            <span className="text-ocean-light/70 font-bold">#</span>
            <span className="text-ocean-light font-bold text-sm">general</span>
            <div className="h-4 w-px bg-ocean-dark-border mx-2" />
            <span className="text-ocean-light/60 text-xs">Kênh trò chuyện chính</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden px-4 py-4 flex flex-col justify-end gap-3">
            {MOCK_MESSAGES.map((msg) => (
              <MockMessage key={msg.id} {...msg} />
            ))}
          </div>

          {/* Message input */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 bg-ocean-dark-surface border border-ocean-dark-border px-4 py-3">
              <svg className="w-5 h-5 text-ocean-light/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-ocean-light/60 text-sm flex-1">
                Nhắn tin tới #general
              </span>
              <svg className="w-5 h-5 text-ocean-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Members sidebar — hidden on small */}
        <div className="hidden lg:flex w-48 bg-ocean-dark-surface border-l border-ocean-dark-border flex-col py-4 px-3">
          <p className="text-ocean-light/60 text-[10px] font-bold uppercase tracking-widest mb-2">
            Online — 3
          </p>
          {MOCK_MEMBERS.map((member) => (
            <div key={member.name} className="flex items-center gap-2 py-1.5 hover:bg-ocean-dark-hover px-2 cursor-pointer transition-colors">
              <div className="relative">
                <div className="w-7 h-7 bg-ocean-primary flex items-center justify-center text-white text-[10px] font-bold">
                  {member.initials}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 ${member.statusClass}`} />
              </div>
              <span className="text-ocean-secondary text-xs truncate">{member.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MOCK_MESSAGES = [
  {
    id: 1,
    avatar: "B9",
    user: "Bravee9",
    time: "hôm nay lúc 09:41",
    content: "Xin chào! Nền tảng Bravechat đã chính thức đi vào hoạt động.",
    isHighlighted: true,
  },
  {
    id: 2,
    avatar: "SJ",
    user: "Shuji",
    time: "hôm nay lúc 09:43",
    content: "Giao diện được thiết kế hiện đại, tinh giản và chuyên nghiệp.",
    isHighlighted: false,
  },
  {
    id: 3,
    avatar: "CH",
    user: "Châu",
    time: "hôm nay lúc 09:44",
    content: "Hệ thống nhắn tin thời gian thực hoạt động ổn định và tối ưu.",
    isHighlighted: false,
  },
];

const MOCK_MEMBERS = [
  { name: "Bravee9", initials: "B9", statusClass: "badge-online" },
  { name: "Shuji", initials: "SJ", statusClass: "badge-online" },
  { name: "Châu", initials: "CH", statusClass: "badge-idle" },
];

function MockMessage({
  avatar,
  user,
  time,
  content,
  isHighlighted,
}: (typeof MOCK_MESSAGES)[0]) {
  return (
    <div
      className={`flex gap-3 group ${
        isHighlighted ? "bg-ocean-primary/5 -mx-4 px-4 py-1 border-l-2 border-ocean-primary" : ""
      }`}
    >
      <div className="w-8 h-8 bg-ocean-primary flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
        {avatar}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-ocean-light text-xs font-bold">{user}</span>
          <span className="text-ocean-light/70 text-[10px]">{time}</span>
        </div>
        <p className="text-ocean-light/90 text-xs mt-0.5">{content}</p>
      </div>
    </div>
  );
}
