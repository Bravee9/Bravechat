/**
 * components/docs/DocsLayout.tsx
 * Shared layout for documentation pages
 */

import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";

const DOCS_NAV = [
  {
    group: "Bắt đầu",
    groupEn: "Getting Started",
    links: [
      { label: "Giới thiệu", labelEn: "Introduction", href: "/docs" },
      { label: "Kiến trúc", labelEn: "Architecture", href: "/docs/architecture" },
    ],
  },
  {
    group: "API",
    groupEn: "API Reference",
    links: [
      { label: "API Reference", labelEn: "API Reference", href: "/docs/api-reference" },
    ],
  },
  {
    group: "Cơ sở dữ liệu",
    groupEn: "Database",
    links: [
      { label: "Database Schema", labelEn: "Database Schema", href: "/docs/database-schema" },
    ],
  },
];

interface DocsLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DocsLayout({ children, title, description }: DocsLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <OceanBackground />
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <div className="mb-4">
                <Link href="/docs" className="flex items-center gap-2 text-ocean-light font-bold text-sm hover:text-ocean-secondary transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tài liệu
                </Link>
              </div>
              <nav className="flex flex-col gap-6">
                {DOCS_NAV.map((group) => (
                  <div key={group.group}>
                    <p className="text-ocean-secondary text-[10px] font-bold uppercase tracking-widest mb-2">
                      {group.group}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {group.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-ocean-light/70 text-sm hover:text-ocean-secondary transition-colors py-1 pl-3 border-l-2 border-transparent hover:border-ocean-secondary"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-ocean-light/60 mb-8 font-mono">
              <Link href="/" className="hover:text-ocean-secondary transition-colors">Trang chủ</Link>
              <span>/</span>
              <Link href="/docs" className="hover:text-ocean-secondary transition-colors">Docs</Link>
              {title !== "Tài liệu" && (
                <>
                  <span>/</span>
                  <span className="text-ocean-secondary">{title}</span>
                </>
              )}
            </nav>

            <div className="border-b border-ocean-dark-border pb-8 mb-10">
              <h1 className="text-3xl md:text-4xl font-black text-ocean-light tracking-tighter">{title}</h1>
              {description && (
                <p className="text-ocean-light/70 mt-3 leading-relaxed">{description}</p>
              )}
            </div>

            <div className="docs-content">
              {children}
            </div>
          </main>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
