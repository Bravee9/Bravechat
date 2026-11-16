/**
 * components/marketing/legal/LegalLayout.tsx
 * Shared layout for legal & static content pages — JetBrains Dark Style
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
    <div className="legal-page relative min-h-screen bg-[#0B0B0D] text-[#E6EDF3]" lang={language}>
      <OceanBackground />
      <Navbar language={language} />

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[75.6px] pt-12 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#7D7D7D] mb-8 font-mono">
          <Link href="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#07C3F2]">{title}</span>
        </nav>

        {/* Page header */}
        <div className="border-b border-[#2B2D30] pb-10 mb-12">
          <p className="font-mono text-xs font-semibold text-[#087CFA] uppercase tracking-wider mb-3">
            {language === "vi" ? "THÔNG TIN PHÁP LÝ" : "LEGAL INFORMATION"}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em] leading-tight">
            <span className="vi-only">{title}</span>
            <span className="en-only">{titleEn}</span>
          </h1>
          <p className="text-[#7D7D7D] text-xs font-mono mt-4">
            {language === "vi" ? "Cập nhật lần cuối" : "Last updated"}: {lastUpdated}
          </p>
          <div
            className="mt-5 inline-flex rounded-[4px] border border-[#2B2D30] bg-[#16161A] p-1"
            role="group"
            aria-label="Ngôn ngữ / Language"
          >
            <button
              type="button"
              onClick={() => setLanguage("vi")}
              aria-pressed={language === "vi"}
              className={`rounded-[2px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                language === "vi"
                  ? "bg-[#087CFA] text-white"
                  : "text-[#A8A8B0] hover:text-white"
              }`}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              className={`rounded-[2px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                language === "en"
                  ? "bg-[#087CFA] text-white"
                  : "text-[#A8A8B0] hover:text-white"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Body — two-column */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sticky sidebar — Table of Contents */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-5">
              <p className="text-[#7D7D7D] text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                {language === "vi" ? "Mục lục" : "Contents"}
              </p>
              <nav className="flex flex-col gap-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-[#A8A8B0] text-xs hover:text-white transition-colors py-1.5 border-l-2 border-transparent hover:border-[#087CFA] pl-3"
                  >
                    {language === "vi" ? s.label : s.labelEn ?? s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article
            data-language={language}
            className={`flex-1 min-w-0 prose-legal ${language === "en" ? "legal-english" : ""}`}
          >
            {children}
          </article>
        </div>
      </main>

      <FooterSection language={language} />
    </div>
  );
}
