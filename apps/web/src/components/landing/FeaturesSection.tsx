/**
 * components/landing/FeaturesSection.tsx
 * Feature highlights — Ocean Swiss Minimalist cards
 */
"use client";

import { useInView } from "@/hooks/useInView";
import { useRef } from "react";

const FEATURES = [
  {
    id: "text-chat",
    icon: <MessageIcon />,
    title: "Nhắn tin thời gian thực",
    description:
      "Giao tiếp bằng văn bản với độ trễ tối thiểu. Tích hợp định dạng Markdown, biểu tượng cảm xúc tùy chỉnh và tính năng xem trước liên kết tự động.",
    tags: ["WebSocket", "Markdown", "Emoji"],
    accent: "#0D5C75",
  },
  {
    id: "voice-video",
    icon: <VoiceIcon />,
    title: "Đàm thoại & Video",
    description:
      "Kênh liên lạc âm thanh và video chất lượng cao. Hỗ trợ chia sẻ màn hình và phát trực tiếp không giới hạn số lượng người tham gia.",
    tags: ["WebRTC", "1080p60", "Screen Share"],
    accent: "#639FAD",
  },
  {
    id: "file-media",
    icon: <MediaIcon />,
    title: "Chia sẻ đa phương tiện",
    description:
      "Hệ thống lưu trữ độc lập. Truy xuất và hiển thị nội dung trực tiếp trong cuộc hội thoại mà không cần sử dụng ứng dụng bên thứ ba.",
    tags: ["Cloudflare R2", "50MB", "Stream"],
    accent: "#0D5C75",
  },
  {
    id: "servers",
    icon: <ServerIcon />,
    title: "Quản lý máy chủ",
    description:
      "Khởi tạo không gian làm việc với đa kênh giao tiếp, phân quyền quản trị chi tiết. Hệ thống liên kết mời truy cập có kiểm soát thời hạn.",
    tags: ["Permissions", "Roles", "Invites"],
    accent: "#639FAD",
  },
  {
    id: "security",
    icon: <SecurityIcon />,
    title: "Bảo mật toàn diện",
    description:
      "Tích hợp hệ thống phân quyền và giới hạn tần suất truy cập. Toàn bộ dữ liệu được xác thực định kỳ và đảm bảo an toàn thông tin tối đa.",
    tags: ["JWT", "Bcrypt", "Rate Limit"],
    accent: "#0D5C75",
  },
  {
    id: "notifications",
    icon: <NotifIcon />,
    title: "Thông báo thông minh",
    description:
      "Hệ thống đề cập cá nhân, thông báo tin nhắn trực tiếp và toàn máy chủ. Linh hoạt tùy chỉnh chi tiết cấu hình thông báo cho từng kênh riêng biệt.",
    tags: ["@Mentions", "Push", "DND Mode"],
    accent: "#639FAD",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-6">
      {/* Section header */}
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-20">
          <div className="section-tag">
            <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block" />
            Tính năng cốt lõi
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-ocean-light tracking-tight leading-normal py-2">
            MỌI THỨ BẠN
            <br />
            <span className="text-gradient-ocean inline-block pt-1 pb-3">CẦN ĐỂ KẾT NỐI</span>
          </h2>
          <p className="mt-6 text-ocean-light/80 text-base leading-relaxed">
            Được xây dựng trên nền tảng công nghệ hiện đại nhất — real-time,
            scalable, và luôn sẵn sàng cho mọi cộng đồng dù lớn hay nhỏ.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ocean-dark-border">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { threshold: 0.1 });

  return (
    <div
      ref={ref}
      className="bg-ocean-dark-bg p-8 group hover:bg-ocean-dark-surface transition-all duration-300 relative overflow-hidden"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s, background 0.3s`,
      }}
    >
      {/* Accent line on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: feature.accent }}
      />

      {/* Icon */}
      <div
        className="w-12 h-12 flex items-center justify-center mb-6 border transition-all duration-300 group-hover:scale-110"
        style={{
          borderColor: `${feature.accent}40`,
          background: `${feature.accent}15`,
          color: feature.accent,
        }}
      >
        {feature.icon}
      </div>

      {/* Content */}
      <h3 className="text-ocean-light font-bold text-lg tracking-tight mb-3">
        {feature.title}
      </h3>
      <p className="text-ocean-light/80 text-sm leading-relaxed mb-5">
        {feature.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {feature.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border border-ocean-secondary/30 text-ocean-secondary bg-ocean-secondary/10"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <svg
          className="w-5 h-5"
          style={{ color: feature.accent }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="square"
            strokeWidth={2}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────
function MessageIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="square" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function VoiceIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="square" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function MediaIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="square" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="square" strokeWidth={1.5} d="M5 12H3m18 0h-2M5.636 5.636l-1.414-1.414M19.778 19.778l-1.414-1.414M12 3V1m0 22v-2m6.364-16.364l-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="square" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function NotifIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="square" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
