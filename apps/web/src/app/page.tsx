/**
 * app/page.tsx
 * Landing page — Bravechat
 */

import type { Metadata } from "next";
import { OceanBackground } from "@/components/ui/OceanBackground";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { FooterSection } from "@/components/landing/FooterSection";
import { StickyMobileCta } from "@/components/landing/StickyMobileCta";

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
    <main className="relative">
      {/* Animated ocean background — fixed behind everything */}
      <OceanBackground />

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
