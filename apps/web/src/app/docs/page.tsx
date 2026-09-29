/**
 * app/docs/page.tsx
 * Trang chủ Tài liệu / Docs Index
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/docs/DocsLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tài liệu",
  description: "Tài liệu kỹ thuật của Bravechat — API Reference, Kiến trúc hệ thống và Database Schema.",
};

const DOC_CARDS = [
  {
    href: "/docs/architecture",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: "Kiến trúc",
    titleEn: "Architecture",
    description: "Tổng quan kiến trúc hệ thống — Monorepo, stack công nghệ, luồng dữ liệu và cơ sở hạ tầng.",
  },
  {
    href: "/docs/api-reference",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "API Reference",
    titleEn: "API Reference",
    description: "Tài liệu toàn bộ các endpoint REST API — xác thực, máy chủ, kênh, tin nhắn và người dùng.",
  },
  {
    href: "/docs/database-schema",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    title: "Database Schema",
    titleEn: "Database Schema",
    description: "Cấu trúc cơ sở dữ liệu PostgreSQL — ERD tổng quan và chi tiết từng bảng dữ liệu.",
  },
];

export default function DocsPage() {
  return (
    <DocsLayout title="Tài liệu" description="Tài liệu kỹ thuật chính thức của Bravechat dành cho nhà phát triển và cộng tác viên.">
      {/* Tech stack summary */}
      <div className="mb-12">
        <h2 className="text-lg font-black text-ocean-light mb-4 tracking-tight">Tổng quan Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ocean-dark-border">
          {[
            { label: "Frontend", value: "Next.js 14" },
            { label: "Backend", value: "Fastify" },
            { label: "Database", value: "PostgreSQL" },
            { label: "Cache", value: "Redis" },
            { label: "Storage", value: "Cloudflare R2" },
            { label: "ORM", value: "Prisma" },
            { label: "Realtime", value: "WebSocket" },
            { label: "Auth", value: "JWT + Bcrypt" },
          ].map((item) => (
            <div key={item.label} className="bg-ocean-dark-bg p-4">
              <p className="text-ocean-light/60 text-xs font-mono uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-ocean-secondary font-bold text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Doc cards */}
      <div className="mb-12">
        <h2 className="text-lg font-black text-ocean-light mb-4 tracking-tight">Tài liệu có sẵn</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ocean-dark-border">
          {DOC_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-ocean-dark-bg p-6 hover:bg-ocean-dark-surface group transition-colors block"
            >
              <div className="text-ocean-secondary mb-4 group-hover:text-ocean-light transition-colors">
                {card.icon}
              </div>
              <h3 className="text-ocean-light font-bold mb-1">{card.title}</h3>
              <p className="text-ocean-secondary text-xs italic mb-3">{card.titleEn}</p>
              <p className="text-ocean-light/60 text-sm leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* GitHub note */}
      <div className="border border-ocean-dark-border p-6">
        <p className="text-ocean-light/60 text-sm leading-relaxed">
          Tài liệu đang trong quá trình hoàn thiện cùng với quá trình phát triển dự án.
          Xem chi tiết và đóng góp tại{" "}
          <a href="https://github.com/Bravee9/Bravechat" target="_blank" rel="noreferrer" className="text-ocean-secondary hover:text-ocean-light">
            GitHub Repository
          </a>.
        </p>
      </div>
    </DocsLayout>
  );
}
