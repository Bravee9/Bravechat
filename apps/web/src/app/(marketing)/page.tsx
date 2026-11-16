/**
 * app/(marketing)/page.tsx
 * Landing page — Bravechat (Figma Design 67:4)
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { HeroSection } from "@/components/marketing/landing/HeroSection";
import { FeaturesSection } from "@/components/marketing/landing/FeaturesSection";
import { CommunitySection } from "@/components/marketing/landing/CommunitySection";
import { FooterSection } from "@/components/marketing/landing/FooterSection";
import { StickyMobileCta } from "@/components/marketing/landing/StickyMobileCta";

export const metadata: Metadata = {
  title: { absolute: "Bravechat — Giao tiếp không giới hạn" },
  description:
    "Bravechat là nền tảng giao tiếp thời gian thực cho cộng đồng, nhóm và bạn bè. Nhắn tin, giọng nói, video — tất cả trong một nơi. Tham gia miễn phí.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Bravechat — Giao tiếp không giới hạn",
    description:
      "Nhắn tin, giọng nói, video cho cộng đồng, nhóm và bạn bè. Tham gia miễn phí.",
    url: "/",
    siteName: "Bravechat",
    locale: "vi_VN",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main
      className="figma-landing relative bg-[#0b0b0d] min-h-screen text-white overflow-x-hidden"
      data-node-id="67:4"
    >
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:left-2 focus:top-2 bg-[#111827] px-3 py-2 rounded-[6px] text-sm font-semibold text-white"
        data-node-id="67:307"
      >
        Skip to content
      </a>

      {/* Navigation */}
      <Navbar />

      {/* Page sections */}
      <HeroSection />
      <FeaturesSection />
      <CommunitySection />
      <FooterSection />
      <StickyMobileCta />
    </main>
  );
}
