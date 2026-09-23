/**
 * app/page.tsx
 * Landing page — Bravechat
 */

import { OceanBackground } from "@/components/ui/OceanBackground";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { FooterSection } from "@/components/landing/FooterSection";

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
    </main>
  );
}
