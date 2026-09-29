/**
 * app/docs/architecture/page.tsx
 * Kiến trúc Hệ thống / Architecture Documentation
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/docs/DocsLayout";

export const metadata: Metadata = {
  title: "Kiến trúc Hệ thống",
  description: "Tổng quan kiến trúc kỹ thuật của Bravechat — Monorepo, stack công nghệ, luồng dữ liệu.",
};

export default function ArchitecturePage() {
  return (
    <DocsLayout
      title="Kiến trúc Hệ thống"
      description="Tổng quan kiến trúc kỹ thuật của Bravechat — từ cấu trúc Monorepo đến luồng xử lý dữ liệu thời gian thực."
    >
      {/* Architecture diagram */}
      <DocSection title="Sơ đồ Kiến trúc" titleEn="Architecture Diagram">
        <CodeBlock>{`┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                    Next.js 14 (App Router)                       │
│           Landing + Auth + App (SSR/SSG + SPA hybrid)           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP / WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│                    Fastify (Node.js)                             │
│         REST API + Socket.io WebSocket Server                    │
│  ┌──────────────┬───────────────┬────────────────────────────┐  │
│  │ Auth Routes  │ Server Routes │ Message Routes + WS Handler│  │
│  └──────────────┴───────────────┴────────────────────────────┘  │
│                     Prisma ORM                                   │
└──────────────┬──────────────────────────────────────────────────┘
               │
       ┌───────┼────────────────┬─────────────────────┐
       ▼       ▼                ▼                     ▼
┌──────────┐ ┌──────────┐ ┌───────────┐  ┌────────────────────────┐
│PostgreSQL│ │  Redis   │ │  BullMQ   │  │   Cloudflare R2        │
│(Primary  │ │(Cache +  │ │(Job Queue │  │   (Object Storage)     │
│ Database)│ │ Pub/Sub) │ │ Workers)  │  │   Images/Video/Files   │
└──────────┘ └──────────┘ └───────────┘  └────────────────────────┘`}</CodeBlock>
      </DocSection>

      {/* Monorepo structure */}
      <DocSection title="Cấu trúc Monorepo (Turborepo)" titleEn="Monorepo Structure">
        <CodeBlock>{`bravechat/
├── apps/
│   ├── web/                   # Next.js 14 Frontend
│   └── api/                   # Fastify Backend
├── packages/
│   ├── shared/                # Shared TypeScript types & utilities
│   └── database/              # Prisma schema & migrations
├── docs/                      # Technical documentation
├── docker-compose.yml         # Local dev services
├── turbo.json                 # Turborepo pipeline
└── pnpm-workspace.yaml        # pnpm workspace config`}</CodeBlock>
      </DocSection>

      {/* Tech stack */}
      <DocSection title="Stack Công nghệ" titleEn="Technology Stack">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ocean-dark-border mb-4">
          {[
            { layer: "Frontend", tech: "Next.js 14 (App Router)", note: "SSR/SSG + SPA hybrid" },
            { layer: "Styling", tech: "TailwindCSS + Vanilla CSS", note: "Ocean Swiss Minimalist design system" },
            { layer: "Backend", tech: "Fastify (Node.js)", note: "High-performance HTTP + WebSocket" },
            { layer: "ORM", tech: "Prisma", note: "Type-safe database access" },
            { layer: "Database", tech: "PostgreSQL", note: "Primary data store" },
            { layer: "Cache / Pub-Sub", tech: "Redis", note: "Session cache, real-time pub/sub" },
            { layer: "Job Queue", tech: "BullMQ", note: "Background jobs, media processing" },
            { layer: "Object Storage", tech: "Cloudflare R2", note: "Media files, avatars, attachments" },
            { layer: "Realtime", tech: "Socket.io", note: "WebSocket gateway with rooms" },
            { layer: "Authentication", tech: "JWT + Bcrypt", note: "Short-lived access + refresh token rotation" },
            { layer: "Language", tech: "TypeScript", note: "Strict mode, end-to-end type safety" },
            { layer: "Monorepo", tech: "Turborepo + pnpm", note: "Workspace & pipeline management" },
          ].map((item) => (
            <div key={item.layer} className="bg-ocean-dark-bg p-4">
              <p className="text-ocean-secondary text-xs font-bold uppercase tracking-wider mb-1">{item.layer}</p>
              <p className="text-ocean-light font-bold text-sm">{item.tech}</p>
              <p className="text-ocean-light/50 text-xs mt-0.5 font-mono">{item.note}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {/* Data flows */}
      <DocSection title="Luồng Dữ liệu" titleEn="Data Flows">
        <p className="text-ocean-light/70 text-sm mb-4">
          <strong className="text-ocean-light">REST API Request:</strong>
        </p>
        <CodeBlock>{`Browser → Next.js → Fastify Route → Middleware (Auth / Rate Limit)
→ Service Layer → Prisma → PostgreSQL → Response`}</CodeBlock>

        <p className="text-ocean-light/70 text-sm mt-6 mb-4">
          <strong className="text-ocean-light">Luồng tin nhắn thời gian thực:</strong>
        </p>
        <CodeBlock>{`Client A → Socket.io → Redis Pub/Sub → Socket.io → Client B, C, D...
                     ↓
               PostgreSQL (persist message)
                     ↓
               BullMQ (media processing jobs)`}</CodeBlock>

        <p className="text-ocean-light/70 text-sm mt-6 mb-4">
          <strong className="text-ocean-light">Luồng tải lên tệp (File Upload):</strong>
        </p>
        <CodeBlock>{`Client → Fastify /upload → Validate (type, size)
→ AWS SDK S3 → Cloudflare R2 Bucket
→ Save attachment record → PostgreSQL (r2_key, metadata)
→ Return public URL to client`}</CodeBlock>
      </DocSection>

      {/* Security */}
      <DocSection title="Kiến trúc Bảo mật" titleEn="Security Architecture">
        <div className="flex flex-col gap-4">
          {[
            {
              title: "JWT Access Token",
              detail: "Thời hạn ngắn (15 phút), lưu trong bộ nhớ JavaScript (không lưu trong localStorage). Tránh XSS.",
            },
            {
              title: "Refresh Token",
              detail: "Thời hạn dài (7 ngày), lưu trong HttpOnly cookie — không thể truy cập từ JavaScript. Tránh CSRF.",
            },
            {
              title: "Token Rotation",
              detail: "Refresh token bị thu hồi ngay sau khi sử dụng, cặp token mới được phát hành. Phòng chống replay attack.",
            },
            {
              title: "Blacklist",
              detail: "Redis lưu các token đã bị thu hồi (hỗ trợ đăng xuất ngay lập tức).",
            },
            {
              title: "Rate Limiting",
              detail: "Giới hạn tần suất theo IP và theo tài khoản cho tất cả các endpoint xác thực.",
            },
            {
              title: "Bcrypt",
              detail: "Toàn bộ mật khẩu được băm với cost factor ≥ 12. Mật khẩu gốc không bao giờ lưu trữ.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 border border-ocean-dark-border p-4">
              <div className="w-2 h-2 bg-ocean-secondary flex-shrink-0 mt-1.5" />
              <div>
                <p className="text-ocean-light font-bold text-sm">{item.title}</p>
                <p className="text-ocean-light/60 text-sm mt-1 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </DocSection>
    </DocsLayout>
  );
}

function DocSection({ title, titleEn, children }: { title: string; titleEn: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <div className="mb-5">
        <h2 className="text-xl font-black text-ocean-light tracking-tight">{title}</h2>
        <p className="text-ocean-secondary text-xs italic mt-0.5 font-mono">{titleEn}</p>
        <div className="mt-3 h-px bg-ocean-dark-border" />
      </div>
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-[#030C10] border border-ocean-dark-border p-4 overflow-x-auto text-xs font-mono text-ocean-secondary leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}
