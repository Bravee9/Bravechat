/**
 * app/changelog/page.tsx
 * Nhật ký thay đổi / Changelog
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Nhật ký thay đổi của Bravechat — lịch sử các bản cập nhật và tính năng mới.",
};

const ENTRIES = [
  {
    version: "0.3.0",
    date: "28/09/2026",
    tag: "alpha",
    changes: {
      added: [
        "Trang pháp lý đầy đủ: Điều khoản Sử dụng, Chính sách Bảo mật, Cookie Policy (song ngữ Việt/Anh)",
        "Trang Lộ trình (Roadmap) với 4 giai đoạn phát triển",
        "Trang Changelog, Status, Docs (API Reference, Architecture, Database Schema)",
        "Trang Quên mật khẩu với trạng thái xác nhận",
        "Logo và Favicon mới từ thư mục assets",
      ],
      changed: [
        "Toàn bộ câu từ trang chủ được viết lại theo phong cách nghiêm túc, chuyên nghiệp",
        "Xóa hoàn toàn emoji và từ ngữ lóng (slang) khỏi toàn bộ Landing Page",
        "Nội dung testimonials, features, footer được chuẩn hóa ngôn ngữ",
      ],
      fixed: [],
    },
  },
  {
    version: "0.2.0",
    date: "23/09/2026",
    tag: "alpha",
    changes: {
      added: [
        "Hệ thống thiết kế Ocean Swiss Minimalist hoàn chỉnh (globals.css)",
        "Landing Page: HeroSection với hiệu ứng typewriter, FeaturesSection, CommunitySection, FooterSection",
        "Navbar responsive với mobile menu",
        "Trang đăng nhập (Login) với form validation đầy đủ, hiển thị/ẩn mật khẩu",
        "Trang đăng ký (Register) với password strength meter, validation toàn diện",
        "AuthLayout chia đôi màn hình (branding panel + form panel)",
        "OceanBackground component với animation gradient",
        "Hook useInView cho scroll animations",
        "Mock App Preview trong Hero section",
      ],
      changed: [],
      fixed: [],
    },
  },
  {
    version: "0.1.0",
    date: "21/09/2026",
    tag: "alpha",
    changes: {
      added: [
        "Khởi tạo Monorepo với Turborepo + pnpm workspaces",
        "Next.js 14 (App Router) cho frontend tại apps/web",
        "Fastify + TypeScript cho backend tại apps/api",
        "Packages: @bravechat/database (Prisma + PostgreSQL), @bravechat/shared",
        "Database schema: Users, Servers, Channels, Messages, Roles, Invites",
        "Docker Compose cho môi trường phát triển (PostgreSQL, Redis)",
        "Cấu hình TailwindCSS, ESLint, TypeScript",
        "File .env.example với hướng dẫn cấu hình",
      ],
      changed: [],
      fixed: [],
    },
  },
];

const TAG_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  alpha: {
    label: "Alpha",
    color: "text-amber-400",
    border: "border-amber-500/40",
  },
  beta: {
    label: "Beta",
    color: "text-ocean-secondary",
    border: "border-ocean-secondary/40",
  },
  stable: {
    label: "Stable",
    color: "text-emerald-400",
    border: "border-emerald-500/40",
  },
};

const TYPE_CONFIG = {
  added: { label: "Thêm mới", color: "text-emerald-400", bg: "bg-emerald-500" },
  changed: { label: "Thay đổi", color: "text-amber-400", bg: "bg-amber-500" },
  fixed: { label: "Sửa lỗi", color: "text-ocean-secondary", bg: "bg-ocean-secondary" },
};

export default function ChangelogPage() {
  return (
    <div className="relative min-h-screen">
      <OceanBackground />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ocean-light/60 mb-10 font-mono">
          <Link href="/" className="hover:text-ocean-secondary transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-ocean-secondary">Changelog</span>
        </nav>

        {/* Header */}
        <div className="border-b border-ocean-dark-border pb-10 mb-16">
          <div className="section-tag mb-6">
            <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block" />
            Sản phẩm · Product
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-ocean-light tracking-tighter">
            CHANGELOG
          </h1>
          <p className="text-ocean-secondary text-lg mt-2 font-light italic">Nhật ký Thay đổi</p>
          <p className="text-ocean-light/70 mt-4 leading-relaxed">
            Lịch sử toàn bộ các bản cập nhật, tính năng mới và thay đổi của Bravechat. Mỗi mục
            được phân loại theo phiên bản và ngày phát hành.
          </p>
        </div>

        {/* Entries */}
        <div className="flex flex-col gap-14">
          {ENTRIES.map((entry, index) => {
            const tagCfg = TAG_CONFIG[entry.tag] ?? TAG_CONFIG.alpha;
            return (
              <article key={entry.version} className="relative">
                {/* Timeline line */}
                {index < ENTRIES.length - 1 && (
                  <div className="absolute left-[1.35rem] top-16 bottom-0 w-px bg-ocean-dark-border -mb-14" />
                )}

                {/* Version header */}
                <div className="flex items-start gap-4 mb-6">
                  {/* Timeline dot */}
                  <div className="w-11 h-11 bg-ocean-dark-surface border border-ocean-dark-border flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 bg-ocean-secondary" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-2xl font-black text-ocean-light tracking-tight">
                        v{entry.version}
                      </h2>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${tagCfg.border} ${tagCfg.color}`}>
                        {tagCfg.label}
                      </span>
                    </div>
                    <p className="text-ocean-light/60 text-xs font-mono">{entry.date}</p>
                  </div>
                </div>

                {/* Changes */}
                <div className="ml-[3.75rem] flex flex-col gap-6">
                  {(["added", "changed", "fixed"] as const).map((type) => {
                    const items = entry.changes[type];
                    if (!items?.length) return null;
                    const typeCfg = TYPE_CONFIG[type];
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 ${typeCfg.bg}`} />
                          <span className={`text-xs font-bold uppercase tracking-widest ${typeCfg.color}`}>
                            {typeCfg.label}
                          </span>
                        </div>
                        <ul className="flex flex-col gap-2 pl-4 border-l border-ocean-dark-border">
                          {items.map((item) => (
                            <li key={item} className="text-ocean-light/80 text-sm leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        {/* GitHub link */}
        <div className="mt-16 border border-ocean-dark-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-ocean-light font-bold">Xem toàn bộ lịch sử commit</p>
            <p className="text-ocean-light/60 text-sm mt-1">Full commit history on GitHub</p>
          </div>
          <a
            href="https://github.com/Bravee9/Bravechat"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs flex-shrink-0"
          >
            GitHub Repository →
          </a>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
