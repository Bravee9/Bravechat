/**
 * app/roadmap/page.tsx
 * Lộ trình phát triển / Roadmap
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lộ trình",
  description: "Lộ trình phát triển của Bravechat — những tính năng đã ra mắt và kế hoạch tương lai.",
};

const PHASES = [
  {
    phase: "Alpha",
    period: "Q3 2026",
    status: "completed" as const,
    items: [
      { label: "Kiến trúc Monorepo (Turborepo, pnpm)", done: true },
      { label: "Thiết kế hệ thống Ocean Swiss Minimalist", done: true },
      { label: "Trang Landing Page đầy đủ", done: true },
      { label: "Hệ thống xác thực JWT + Refresh Token", done: true },
      { label: "Giao diện đăng ký & đăng nhập", done: true },
      { label: "Trang pháp lý: Điều khoản, Bảo mật, Cookie", done: true },
      { label: "Schema cơ sở dữ liệu PostgreSQL", done: true },
    ],
  },
  {
    phase: "Beta 1",
    period: "Q4 2026",
    status: "in-progress" as const,
    items: [
      { label: "API xác thực (Đăng ký / Đăng nhập / Đăng xuất)", done: false },
      { label: "Quản lý máy chủ (tạo, chỉnh sửa, xóa)", done: false },
      { label: "Kênh văn bản — nhắn tin WebSocket thời gian thực", done: false },
      { label: "Hệ thống phân quyền theo Vai trò (RBAC)", done: false },
      { label: "Hệ thống liên kết mời (Invite Link)", done: false },
      { label: "Lưu trữ tệp đính kèm trên Cloudflare R2", done: false },
      { label: "Giao diện ứng dụng chính (App UI)", done: false },
    ],
  },
  {
    phase: "Beta 2",
    period: "Q1 2027",
    status: "planned" as const,
    items: [
      { label: "Kênh giọng nói & video (WebRTC)", done: false },
      { label: "Chia sẻ màn hình", done: false },
      { label: "Tin nhắn trực tiếp (Direct Messages)", done: false },
      { label: "Hệ thống thông báo đẩy", done: false },
      { label: "Tìm kiếm tin nhắn toàn cục", done: false },
      { label: "Bot và tích hợp Webhook", done: false },
    ],
  },
  {
    phase: "v1.0 (Stable)",
    period: "Q2 2027",
    status: "planned" as const,
    items: [
      { label: "Ứng dụng Desktop (Electron/Tauri)", done: false },
      { label: "Ứng dụng Di động (React Native)", done: false },
      { label: "Tùy chỉnh giao diện nâng cao", done: false },
      { label: "Công cụ kiểm duyệt nội dung", done: false },
      { label: "API công khai cho nhà phát triển", done: false },
      { label: "Đa ngôn ngữ (i18n)", done: false },
    ],
  },
];

const STATUS_CONFIG = {
  completed: {
    label: "Hoàn thành",
    labelEn: "Completed",
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
  },
  "in-progress": {
    label: "Đang phát triển",
    labelEn: "In Progress",
    color: "text-ocean-secondary",
    border: "border-ocean-secondary/40",
    dot: "bg-ocean-secondary animate-pulse",
    bg: "bg-ocean-secondary/10",
  },
  planned: {
    label: "Kế hoạch",
    labelEn: "Planned",
    color: "text-ocean-light/50",
    border: "border-ocean-dark-border",
    dot: "bg-ocean-light/30",
    bg: "bg-ocean-dark-surface/50",
  },
};

export default function RoadmapPage() {
  return (
    <div className="relative min-h-screen">
      <OceanBackground />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ocean-light/60 mb-10 font-mono">
          <Link href="/" className="hover:text-ocean-secondary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-ocean-secondary">Lộ trình</span>
        </nav>

        {/* Header */}
        <div className="border-b border-ocean-dark-border pb-10 mb-16">
          <div className="section-tag mb-6">
            <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block animate-pulse" />
            Sản phẩm · Product
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-ocean-light tracking-tighter">
            LỘ TRÌNH PHÁT TRIỂN
          </h1>
          <p className="text-ocean-secondary text-lg mt-2 font-light italic">Development Roadmap</p>
          <p className="text-ocean-light/70 mt-4 max-w-xl leading-relaxed">
            Bản đồ phát triển công khai của Bravechat. Cập nhật theo từng giai đoạn và phản ánh
            trạng thái thực tế của dự án.
          </p>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-6 mb-16">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-2 h-2 ${cfg.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-ocean-light/40 text-xs">/ {cfg.labelEn}</span>
            </div>
          ))}
        </div>

        {/* Phases grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ocean-dark-border">
          {PHASES.map((phase) => {
            const cfg = STATUS_CONFIG[phase.status];
            const done = phase.items.filter((i) => i.done).length;
            const total = phase.items.length;

            return (
              <div key={phase.phase} className={`p-8 ${cfg.bg} border border-ocean-dark-border`}>
                {/* Phase header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 border ${cfg.border} mb-3`}>
                      <div className={`w-1.5 h-1.5 ${cfg.dot}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-ocean-light tracking-tight">
                      {phase.phase}
                    </h2>
                    <p className="text-ocean-light/60 text-sm font-mono mt-1">{phase.period}</p>
                  </div>
                  {/* Progress */}
                  <div className="text-right">
                    <span className="text-2xl font-black text-ocean-light">{done}</span>
                    <span className="text-ocean-light/40">/{total}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-px bg-ocean-dark-border mb-6">
                  <div
                    className="h-full bg-ocean-secondary transition-all duration-700"
                    style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                  />
                </div>

                {/* Items */}
                <ul className="flex flex-col gap-3">
                  {phase.items.map((item) => (
                    <li key={item.label} className="flex items-start gap-3">
                      <div className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center mt-0.5 ${item.done ? "bg-ocean-primary border-ocean-primary" : "border-ocean-dark-border"}`}>
                        {item.done && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="square" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm leading-relaxed ${item.done ? "text-ocean-light" : "text-ocean-light/60"}`}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-12 border border-ocean-dark-border p-6">
          <p className="text-ocean-light/60 text-sm leading-relaxed font-mono">
            Lộ trình này phản ánh kế hoạch dự kiến và có thể thay đổi theo thực tế phát triển.
            Để theo dõi tiến độ cụ thể, xem tại{" "}
            <a href="https://github.com/Bravee9/Bravechat" target="_blank" rel="noreferrer" className="text-ocean-secondary hover:text-ocean-light">
              GitHub Repository
            </a>.
          </p>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
