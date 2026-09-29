/**
 * components/legal/LegalLayout.tsx
 * Shared layout for legal & static content pages — Ocean Swiss Minimalist
 */

import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";

interface Section {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  titleEn: string;
  lastUpdated: string;
  sections: Section[];
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  titleEn,
  lastUpdated,
  sections,
  children,
}: LegalLayoutProps) {
  return (
    <div className="relative min-h-screen">
      <OceanBackground />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ocean-light/60 mb-10 font-mono">
          <Link href="/" className="hover:text-ocean-secondary transition-colors">
            Trang chủ
          </Link>
          <span className="text-ocean-dark-border">/</span>
          <span className="text-ocean-secondary">{title}</span>
        </nav>

        {/* Page header */}
        <div className="border-b border-ocean-dark-border pb-10 mb-12">
          <div className="section-tag mb-6">
            <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block" />
            Pháp lý · Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-ocean-light tracking-tighter leading-tight">
            {title}
          </h1>
          <p className="text-ocean-secondary text-lg mt-2 font-light italic">{titleEn}</p>
          <p className="text-ocean-light/60 text-xs font-mono mt-4">
            Cập nhật lần cuối / Last updated: {lastUpdated}
          </p>
        </div>

        {/* Body — two-column */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sticky sidebar — Table of Contents */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <p className="text-ocean-secondary text-xs font-bold uppercase tracking-widest mb-4">
                Nội dung
              </p>
              <nav className="flex flex-col gap-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-ocean-light/70 text-sm hover:text-ocean-secondary transition-colors py-1 border-l-2 border-transparent hover:border-ocean-secondary pl-3"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article className="flex-1 min-w-0 prose-legal">
            {children}
          </article>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
