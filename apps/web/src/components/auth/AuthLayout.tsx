/**
 * components/auth/AuthLayout.tsx
 * JetBrains Dark centered layout for authentication flows
 */

import Link from "next/link";
import { OceanBackground } from "@/components/ui/OceanBackground";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  switchText?: string;
  switchLink?: string;
  switchLabel?: string;
  sidePanel?: React.ReactNode;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  switchText,
  switchLink,
  switchLabel,
  sidePanel,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between w-full overflow-hidden bg-[#0B0B0D] text-[#DFE1E5] selection:bg-[#087CFA]/40 selection:text-white">
      <OceanBackground />

      {/* Top brand header */}
      <header className="relative z-20 px-6 py-5 sm:px-10 border-b border-[#2B2D30] bg-[#0B0B0D]/90 backdrop-blur-md flex items-center justify-between">
        <BrandLogo href="/" size="md" />
        <div className="flex items-center gap-5 text-xs font-medium text-[#7D7D7D]">
          <Link href="/docs" className="hover:text-white transition-colors">
            Hướng dẫn
          </Link>
          <Link href="/status" className="hover:text-white transition-colors">
            Trạng thái
          </Link>
        </div>
      </header>

      {/* Centered container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        <div
          className={cn(
            "w-full bg-[#16161A] border border-[#2B2D30] p-6 sm:p-8 transition-all animate-fade-in",
            sidePanel ? "max-w-[784px]" : "max-w-[460px]"
          )}
        >
          <div
            className={cn(
              sidePanel
                ? "grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 items-center"
                : "block"
            )}
          >
            {/* Primary credentials column */}
            <div className={cn(sidePanel ? "md:pr-8 md:border-r md:border-[#2B2D30]" : "")}>
              <div className="mb-6 text-center md:text-left">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {title}
                </h1>
                <p className="text-[#9999A2] text-sm mt-1.5 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {children}

              {switchText && switchLink && switchLabel && (
                <p className="auth-switch-link mt-5 text-xs sm:text-sm text-[#9999A2] text-center md:text-left">
                  {switchText}{" "}
                  <Link
                    href={switchLink}
                    className="text-[#07C3F2] hover:underline font-medium transition-colors"
                  >
                    {switchLabel}
                  </Link>
                </p>
              )}
            </div>

            {/* Optional QR Code panel */}
            {sidePanel && (
              <div className="hidden md:flex flex-col items-center justify-center">
                {sidePanel}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer legal disclaimer */}
      <footer className="relative z-10 py-4 px-4 text-center text-xs text-[#7D7D7D] border-t border-[#2B2D30]/60">
        Khi tiếp tục sử dụng, bạn đồng ý với{" "}
        <Link href="/terms" className="underline hover:text-white">
          Điều khoản sử dụng
        </Link>{" "}
        và{" "}
        <Link href="/privacy" className="underline hover:text-white">
          Chính sách bảo mật
        </Link>
        .
      </footer>
    </div>
  );
}
