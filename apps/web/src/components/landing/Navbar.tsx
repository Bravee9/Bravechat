/**
 * components/landing/Navbar.tsx
 * Landing page navigation — Ocean Swiss Minimalist
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Tính năng", href: "/#features" },
  { label: "Cộng đồng", href: "/#community" },
  { label: "Lộ trình", href: "/roadmap" },
  { label: "Tài liệu", href: "/docs" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "glass-ocean shadow-md shadow-black/20"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/favicon.png" alt="Bravechat Icon" className="w-8 h-8 object-contain" />
          <span className="font-bold text-xl text-ocean-light tracking-tight group-hover:text-white transition-colors">
            Brave<span className="text-ocean-secondary">chat</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ocean-secondary text-sm font-medium uppercase tracking-wider hover:text-ocean-light transition-colors duration-200 relative group"
            >
              {link.label}
              {/* Underline indicator */}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-ocean-primary group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-ocean-secondary text-sm font-bold uppercase tracking-wider hover:text-ocean-light transition-colors px-4 py-2"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="btn-primary text-xs py-2.5 px-5"
          >
            Bắt đầu ngay
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden text-ocean-secondary hover:text-ocean-light transition-colors p-2"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileOpen ? (
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-ocean-dark-surface border-t border-ocean-dark-border animate-fade-in">
          <div className="px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className="text-ocean-secondary font-medium uppercase tracking-wider hover:text-ocean-light transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="divider-ocean" />
            <Link href="/login" className="btn-secondary text-center text-xs">
              Đăng nhập
            </Link>
            <Link href="/register" className="btn-primary text-center text-xs">
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function OceanLogoMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
      <path
        d="M4 22C8 16 12 20 16 16C20 12 24 18 28 14"
        stroke="#D6E8ED"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      <path
        d="M4 26C8 20 12 24 16 20C20 16 24 22 28 18"
        stroke="#639FAD"
        strokeWidth="2"
        strokeLinecap="square"
        opacity="0.6"
      />
    </svg>
  );
}
