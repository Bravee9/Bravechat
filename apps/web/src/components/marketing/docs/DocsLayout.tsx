/**
 * components/marketing/docs/DocsLayout.tsx
 * Shared layout for documentation pages — JetBrains Dark Style
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { FooterSection } from "@/components/marketing/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";

const DOCS_NAV = [
  {
    group: "Hướng dẫn sử dụng",
    links: [
      { label: "Tổng quan & Bắt đầu", href: "/docs" },
      { label: "Tổ chức Không gian & Phân quyền", href: "/docs/architecture" },
    ],
  },
  {
    group: "Tích hợp & Tự động hóa",
    links: [
      { label: "Giao tiếp & Tích hợp", href: "/docs/api-reference" },
    ],
  },
  {
    group: "Dữ liệu & Quyền riêng tư",
    links: [
      { label: "Cấu trúc Dữ liệu & Bảo mật", href: "/docs/database-schema" },
    ],
  },
];

interface DocsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-[#0B0B0D] text-[#E6EDF3]">
      <OceanBackground />
      <Navbar />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[75.6px] pt-12 pb-24">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-5">
              <div className="pb-4 mb-4 border-b border-[#2B2D30]">
                <Link
                  href="/docs"
                  className="flex items-center gap-2.5 text-white font-semibold text-sm hover:text-[#07C3F2] transition-colors"
                >
                  <span className="w-2 h-2 rounded-xs bg-[#087CFA]" />
                  Tài liệu hướng dẫn
                </Link>
              </div>
              <nav className="flex flex-col gap-6">
                {DOCS_NAV.map((group) => (
                  <div key={group.group}>
                    <p className="text-[#7D7D7D] text-[11px] font-mono font-semibold uppercase tracking-[0.08em] mb-2">
                      {group.group}
                    </p>
                    <div className="flex flex-col gap-1">
                      {group.links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`text-[13px] py-1.5 pl-3 border-l-2 transition-colors ${
                              isActive
                                ? "border-[#087CFA] text-white font-medium bg-[#087CFA]/10"
                                : "border-transparent text-[#A8A8B0] hover:text-white hover:border-[#393B40]"
                            }`}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-[#7D7D7D] mb-6 font-mono">
              <Link href="/" className="hover:text-white transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/docs" className="hover:text-white transition-colors">
                Tài liệu
              </Link>
              {title !== "Tài liệu hướng dẫn" && title !== "Tài liệu" && (
                <>
                  <span>/</span>
                  <span className="text-[#07C3F2]">{title}</span>
                </>
              )}
            </nav>

            <div className="border-b border-[#2B2D30] pb-8 mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-[-0.02em]">
                {title}
              </h1>
              {description && (
                <p className="text-[#A8A8B0] mt-3 text-base leading-relaxed max-w-3xl">
                  {description}
                </p>
              )}
            </div>

            <div className="docs-content">{children}</div>
          </main>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
