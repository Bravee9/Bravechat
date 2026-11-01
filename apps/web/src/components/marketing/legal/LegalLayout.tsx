/**
 * components/legal/LegalLayout.tsx
 * Shared layout for legal & static content pages — Ocean Swiss Minimalist
 */

"use client";
import Link from "next/link";
import { useState } from "react";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { FooterSection } from "@/components/marketing/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";

interface Section {
  id: string;
  label: string;
  labelEn?: string;
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
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  return (
    <div className="legal-page relative min-h-screen" lang={language}>
      <OceanBackground />
      <Navbar language={language} />

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
            {language === "vi" ? "Pháp lý" : "Legal"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-ocean-light tracking-tighter leading-tight">
            <span className="vi-only">{title}</span><span className="en-only">{titleEn}</span>
          </h1>
          {language === "en" ? <p className="text-ocean-secondary text-lg mt-2 font-light italic">{titleEn}</p> : null}
          <p className="text-ocean-light/60 text-xs font-mono mt-4">
            {language === "vi" ? "Cập nhật lần cuối" : "Last updated"}: {lastUpdated}
          </p>
          <div className="mt-5 inline-flex rounded-md border border-ocean-dark-border p-1" role="group" aria-label="Ngôn ngữ / Language">
            <button type="button" onClick={() => setLanguage("vi")} aria-pressed={language === "vi"} className={`rounded px-3 py-1.5 text-xs font-semibold ${language === "vi" ? "bg-ocean-primary text-white" : "text-ocean-light/70 hover:text-ocean-light"}`}>Tiếng Việt</button>
            <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`rounded px-3 py-1.5 text-xs font-semibold ${language === "en" ? "bg-ocean-primary text-white" : "text-ocean-light/70 hover:text-ocean-light"}`}>English</button>
          </div>
        </div>

        {/* Body — two-column */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sticky sidebar — Table of Contents */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <p className="text-ocean-secondary text-xs font-bold uppercase tracking-widest mb-4">
              {language === "vi" ? "Nội dung" : "Contents"}
              </p>
              <nav className="flex flex-col gap-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-ocean-light/70 text-sm hover:text-ocean-secondary transition-colors py-1 border-l-2 border-transparent hover:border-ocean-secondary pl-3"
                  >
                    {language === "vi" ? s.label : (s.labelEn ?? s.label)}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article data-language={language} className={`flex-1 min-w-0 prose-legal ${language === "en" ? "legal-english" : ""}`}>
            {children}
          </article>
        </div>
      </main>

      <FooterSection language={language} />
    </div>
  );
}
