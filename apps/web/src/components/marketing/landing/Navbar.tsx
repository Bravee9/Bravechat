"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const imgIconSearch = "/figma-assets/icon-search.svg";
const imgIconArrowHeader = "/figma-assets/icon-arrow-header.svg";

export function Navbar({ language: _language }: { language?: "vi" | "en" } = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-[16px] bg-[rgba(13,13,16,0.92)] border-b border-[#2e2e34] w-full"
      data-node-id="67:8"
      data-name="MarketingHeader"
    >
      <div className="max-w-[1512px] mx-auto h-[64px] px-5 lg:px-[45.36px] flex items-center justify-between">
        {/* BrandMark: favicon.png + Bravechat */}
        <BrandLogo href="/" size="md" />

        {/* Center/Right Navigation */}
        <div
          className="hidden md:flex flex-1 items-start justify-end min-w-px relative"
          data-node-id="67:36"
        >
          <div className="flex items-start lg:pr-[60.48px] pr-6 relative shrink-0" data-node-id="67:35">
            <nav
              className="flex gap-6 lg:gap-[39.312px] items-center relative shrink-0"
              aria-label="Điều hướng chính"
              data-node-id="67:12"
            >
              <Link
                href="/#features"
                className="flex flex-col items-center justify-center py-[10px] font-['Inter',sans-serif] font-semibold text-[#aaaab3] hover:text-white text-[13px] text-center whitespace-nowrap transition-colors"
                data-node-id="67:13"
              >
                Tính năng
              </Link>
              <Link
                href="/docs"
                className="flex flex-col items-center justify-center py-[10px] font-['Inter',sans-serif] font-semibold text-[#aaaab3] hover:text-white text-[13px] text-center whitespace-nowrap transition-colors"
                data-node-id="67:16"
              >
                Tài liệu
              </Link>
              <Link
                href="/roadmap"
                className="flex flex-col items-center justify-center py-[10px] font-['Inter',sans-serif] font-semibold text-[#aaaab3] hover:text-white text-[13px] text-center whitespace-nowrap transition-colors"
                data-node-id="67:18"
              >
                Lộ trình
              </Link>
              <Link
                href="/status"
                className="flex flex-col items-center justify-center py-[10px] font-['Inter',sans-serif] font-semibold text-[#aaaab3] hover:text-white text-[13px] text-center whitespace-nowrap transition-colors"
                data-node-id="67:20"
              >
                Trạng thái
              </Link>
            </nav>
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex gap-[9px] items-center relative shrink-0" data-node-id="67:22">
          <Link
            href="/login"
            className="flex flex-col items-center justify-center py-[10px] px-2 font-['Inter',sans-serif] font-semibold text-[#aaaab3] hover:text-white text-[13px] text-center whitespace-nowrap transition-colors"
            data-node-id="67:23"
          >
            Đăng nhập
          </Link>
          <Link
            href="/docs"
            aria-label="Tra cứu tài liệu"
            className="bg-[#19191d] hover:bg-[#232329] border border-[#3a3a40] border-solid flex items-center justify-center relative shrink-0 size-[38px] transition-colors"
            data-node-id="67:25"
          >
            <img alt="" src={imgIconSearch} className="block shrink-0" />
          </Link>
          <Link
            href="/channels"
            className="bg-[#087CFA] hover:bg-[#3574F0] border border-[#3574F0] border-solid flex gap-[14px] items-center justify-center min-h-[40px] px-[20px] relative rounded-[2px] shrink-0 transition-colors"
            data-node-id="67:29"
          >
            <span
              className="font-['Inter',sans-serif] font-bold text-[13px] text-center text-white whitespace-nowrap"
              data-node-id="67:30"
            >
              Mở Bravechat
            </span>
            <img alt="" src={imgIconArrowHeader} className="block shrink-0" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden px-3 py-1.5 bg-[#19191d] border border-[#3a3a40] text-xs font-mono text-[#dfe7ff]"
          aria-label="Menu"
        >
          {mobileOpen ? "ĐÓNG" : "MENU"}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#101013] border-b border-[#2e2e34] px-5 py-4 space-y-3 text-[13px] font-['Inter',sans-serif]">
          <Link href="/#features" className="block text-[#aaaab3] hover:text-white" onClick={() => setMobileOpen(false)}>
            Tính năng
          </Link>
          <Link href="/docs" className="block text-[#aaaab3] hover:text-white" onClick={() => setMobileOpen(false)}>
            Tài liệu
          </Link>
          <Link href="/roadmap" className="block text-[#aaaab3] hover:text-white" onClick={() => setMobileOpen(false)}>
            Lộ trình
          </Link>
          <Link href="/status" className="block text-[#aaaab3] hover:text-white" onClick={() => setMobileOpen(false)}>
            Trạng thái
          </Link>
          <div className="pt-2 flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 border border-[#3a3a40] text-[#aaaab3] hover:text-white">
              Đăng nhập
            </Link>
            <Link
              href="/channels"
              className="bg-[#087CFA] border border-[#3574F0] px-4 py-2 rounded-[2px] font-bold text-white inline-flex items-center gap-2"
            >
              <span>Mở Bravechat</span>
              <img alt="" src={imgIconArrowHeader} className="block shrink-0" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
