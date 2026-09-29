/**
 * components/landing/CommunitySection.tsx
 * Social proof & community showcase
 */
"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { formatCount } from "@/lib/utils";

const COMMUNITY_STATS = [
  { value: 10_500_000, label: "Người dùng hoạt động", suffix: "+" },
  { value: 520_000, label: "Server đang chạy", suffix: "+" },
  { value: 2_400_000_000, label: "Tin nhắn mỗi ngày", suffix: "+" },
  { value: 99.9, label: "Uptime SLA", suffix: "%" },
];

const TESTIMONIALS = [
  {
    id: 1,
    content:
      "Bravechat đã thay đổi cách đội ngũ của chúng tôi giao tiếp. Hệ thống nhắn tin thời gian thực hoạt động vô cùng ổn định và nhanh chóng.",
    author: "Nguyễn Minh Tú",
    role: "Lead Developer @ TechVN",
    avatar: "NT",
  },
  {
    id: 2,
    content:
      "Giao diện được thiết kế hiện đại, tốc độ phản hồi nhanh. Tính năng quản lý máy chủ mạnh mẽ, phù hợp với quy mô cộng đồng lớn.",
    author: "Trần Gia Huy",
    role: "Community Manager",
    avatar: "GH",
  },
  {
    id: 3,
    content:
      "Đã trải nghiệm nhiều nền tảng nhưng Bravechat là sự lựa chọn tối ưu nhất. Độ bảo mật cao, toàn bộ dữ liệu đều được mã hóa an toàn.",
    author: "Lê Thị Hương",
    role: "Security Engineer",
    avatar: "LH",
  },
];

export function CommunitySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.05 });

  return (
    <section
      id="community"
      ref={sectionRef}
      className="relative py-32 px-6 bg-ocean-dark-surface border-t border-b border-ocean-dark-border"
    >
      {/* Subtle horizontal lines — Swiss grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-ocean-secondary"
            style={{ top: `${(i + 1) * 12.5}%` }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ocean-dark-border mb-20">
          {COMMUNITY_STATS.map((stat, i) => (
            <StatCard
              key={stat.label}
              stat={stat}
              index={i}
              isVisible={isInView}
            />
          ))}
        </div>

        {/* Testimonials */}
        <div className="max-w-2xl mb-16">
          <div className="section-tag">
            <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block" />
            Từ cộng đồng
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-ocean-light tracking-tight leading-normal py-2">
            ĐƯỢC TIN TƯỞNG BỞI
            <br />
            <span className="text-gradient-ocean inline-block pt-1 pb-3">HÀNG TRIỆU NGƯỜI</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ocean-dark-border">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard
              key={t.id}
              testimonial={t}
              index={i}
              isVisible={isInView}
            />
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-20 flex flex-col md:flex-row items-center justify-between gap-8 border border-ocean-dark-border p-10">
          <div>
            <h3 className="text-2xl font-black text-ocean-light tracking-tight">
              SẴN SÀNG THAM GIA?
            </h3>
            <p className="text-ocean-light/80 mt-2">
              Miễn phí vĩnh viễn. Không cần thẻ tín dụng.
            </p>
          </div>
          <div className="flex gap-4">
            <a href="/register" className="btn-primary text-sm">
              Tạo tài khoản
            </a>
            <a href="#features" className="btn-secondary text-sm">
              Xem tính năng
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  stat,
  index,
  isVisible,
}: {
  stat: (typeof COMMUNITY_STATS)[0];
  index: number;
  isVisible: boolean;
}) {
  return (
    <div
      className="bg-ocean-dark-bg px-8 py-10 text-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.95)",
        transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
      }}
    >
      <div className="text-4xl md:text-5xl font-black text-gradient-ocean tracking-tight">
        {formatCount(stat.value)}
        {stat.suffix}
      </div>
      <div className="text-ocean-light/70 text-xs font-bold uppercase tracking-widest mt-3">
        {stat.label}
      </div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
  isVisible,
}: {
  testimonial: (typeof TESTIMONIALS)[0];
  index: number;
  isVisible: boolean;
}) {
  return (
    <div
      className="bg-ocean-dark-bg p-8 flex flex-col justify-between"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : "translateX(-20px)",
        transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`,
      }}
    >
      {/* Quote mark */}
      <div className="text-ocean-primary text-5xl font-serif leading-snug mb-4">&ldquo;</div>
      <p className="text-ocean-light/90 text-sm leading-relaxed flex-1">
        {testimonial.content}
      </p>
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-ocean-dark-border">
        <div className="w-10 h-10 bg-ocean-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-ocean-light text-sm font-bold">{testimonial.author}</p>
          <p className="text-ocean-light/60 text-xs">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}
