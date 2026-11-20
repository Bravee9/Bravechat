/**
 * components/marketing/legal/LegalLayout.tsx
 * Shared layout for legal & policy pages with multi-language pack selector (vi, en, zh, ko, ja)
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { FooterSection } from "@/components/marketing/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";
import {
  LEGAL_DOCUMENTS,
  LEGAL_UI_CHROME,
  SUPPORTED_LEGAL_LOCALES,
  type LegalLocale,
  type LegalPageKey,
} from "@/i18n/legal-packs";

const LOCALE_STORAGE_KEY = "bravechat_legal_locale";

interface Section {
  id: string;
  label: string;
  labelEn?: string;
}

interface LegalLayoutProps {
  pageKey?: LegalPageKey;
  title?: string;
  titleEn?: string;
  lastUpdated?: string;
  sections?: Section[];
  children?: React.ReactNode;
}

export function LegalLayout({
  pageKey,
  title,
  lastUpdated,
  sections,
  children,
}: LegalLayoutProps) {
  const [locale, setLocale] = useState<LegalLocale>("vi");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY) as LegalLocale | null;
      if (saved && SUPPORTED_LEGAL_LOCALES.some((item) => item.code === saved)) {
        setLocale(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function handleLocaleChange(next: LegalLocale) {
    setLocale(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }

  const chrome = LEGAL_UI_CHROME[locale];
  const pack = pageKey ? LEGAL_DOCUMENTS[pageKey][locale] : null;
  const resolvedTitle = pack ? pack.title : title ?? "";
  const resolvedUpdated = pack ? pack.lastUpdated : lastUpdated ?? "";
  const resolvedSections = pack
    ? pack.sections.map((s) => ({ id: s.id, label: s.heading }))
    : sections ?? [];

  return (
    <div
      className="legal-page relative min-h-screen bg-[#0B0B0D] text-[#E6EDF3]"
      lang={locale}
    >
      <OceanBackground />
      <Navbar />

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[75.6px] pt-12 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#7D7D7D] mb-8 font-mono">
          <Link href="/" className="hover:text-white transition-colors">
            {chrome.homeLabel}
          </Link>
          <span>/</span>
          <span className="text-[#07C3F2]">{resolvedTitle}</span>
        </nav>

        {/* Page header with Language Dropdown Selector */}
        <div className="border-b border-[#2B2D30] pb-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs font-semibold text-[#087CFA] uppercase tracking-wider mb-3">
              {chrome.legalBadge}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em] leading-tight">
              {resolvedTitle}
            </h1>
            <p className="text-[#9CA3AF] text-xs font-mono mt-4">
              {chrome.lastUpdatedLabel}: {resolvedUpdated}
            </p>
          </div>

          {/* Multi-language Dropdown List of Options */}
          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <label
              htmlFor="legal-language-select"
              className="text-[11px] font-mono text-[#9CA3AF]"
            >
              {chrome.languageLabel}
            </label>
            <div className="relative inline-flex items-center">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-3 w-4 h-4 text-[#07C3F2]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <select
                id="legal-language-select"
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value as LegalLocale)}
                aria-label={chrome.languageLabel}
                className="h-10 pl-9 pr-9 rounded-[6px] border border-[#393B40] bg-[#16161A] hover:border-[#5A5D65] focus:border-[#087CFA] focus:outline-none text-xs font-semibold text-white appearance-none cursor-pointer transition-colors min-w-[164px]"
              >
                {SUPPORTED_LEGAL_LOCALES.map((item) => (
                  <option
                    key={item.code}
                    value={item.code}
                    className="bg-[#16161A] text-white"
                  >
                    {item.nativeName}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute right-3 w-3.5 h-3.5 text-[#A8A8B0]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Two-column Body */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sticky sidebar — Table of Contents */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 bg-[#16161A] border border-[#2B2D30] rounded-[6px] p-5">
              <p className="text-[#9CA3AF] text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                {chrome.tocLabel}
              </p>
              <nav className="flex flex-col gap-1">
                {resolvedSections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-[#A8A8B0] text-xs hover:text-white transition-colors py-1.5 border-l-2 border-transparent hover:border-[#087CFA] pl-3"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article data-language={locale} className="flex-1 min-w-0 prose-legal">
            {pack
              ? pack.sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="mb-12 scroll-mt-24"
                  >
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        {section.heading}
                      </h2>
                      <div className="mt-2.5 h-px bg-[#2B2D30]" />
                    </div>

                    {section.paragraphs?.map((p, idx) => (
                      <p
                        key={idx}
                        className="text-[#D1D5DB] text-sm leading-relaxed mb-3.5"
                      >
                        {p}
                      </p>
                    ))}

                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="flex flex-col gap-2 mb-4">
                        {section.bullets.map((b, idx) => (
                          <li
                            key={idx}
                            className="text-[#D1D5DB] text-sm leading-relaxed"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.table && (
                      <div className="overflow-x-auto my-4 rounded-[6px] border border-[#2B2D30]">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-[#16161A] border-b border-[#2B2D30]">
                              {section.table.headers.map((h) => (
                                <th
                                  key={h}
                                  className="text-left px-4 py-2.5 text-[#07C3F2] text-xs font-semibold uppercase tracking-wider"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2B2D30]">
                            {section.table.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="hover:bg-[#16161A]/60 transition-colors"
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`px-4 py-3 text-sm ${
                                      cIdx === 0
                                        ? "font-semibold text-white whitespace-nowrap"
                                        : "text-[#D1D5DB]"
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {section.links && section.links.length > 0 && (
                      <ul className="flex flex-col gap-2 mb-4">
                        {section.links.map((item) => (
                          <li key={item.href}>
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#589DF6] hover:text-[#7EB5FF] underline text-sm"
                            >
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.afterNote && (
                      <p className="text-[#9CA3AF] text-xs leading-relaxed mt-2">
                        {section.afterNote}
                      </p>
                    )}
                  </section>
                ))
              : children}
          </article>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
