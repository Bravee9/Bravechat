/**
 * components/auth/AuthLayout.tsx
 * Dark account authentication shell with flowing diagonal wave gradient
 */

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  switchText?: string;
  switchLink?: string;
  switchLabel?: string;
  wide?: boolean;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  switchText,
  switchLink,
  switchLabel,
  wide = false,
}: AuthLayoutProps) {
  return (
    <div className="auth-shell relative min-h-screen flex flex-col justify-between w-full overflow-x-hidden bg-[#000000] text-[#E5E7EB] selection:bg-[#4682F5]/40 selection:text-white">
      {/* Top navigation bar */}
      <header className="relative z-20 h-14 px-5 sm:px-8 border-b border-white/[0.08] bg-[#19191C] flex items-center justify-between">
        <BrandLogo href="/" size="sm" />
        <div className="flex items-center gap-4 sm:gap-5 text-xs font-medium text-[#A8AAB3]">
          <Link href="/docs" className="hover:text-white transition-colors">
            Hướng dẫn
          </Link>
          <Link href="/status" className="hover:text-white transition-colors">
            Trạng thái
          </Link>
          <Link
            href="/docs"
            aria-label="Trợ giúp"
            title="Trung tâm trợ giúp"
            className="w-5 h-5 rounded-full bg-[#6E7076]/40 hover:bg-[#6E7076]/70 text-[#19191C] bg-[#9CA3AF] hover:bg-white flex items-center justify-center text-[11px] font-bold transition-colors"
          >
            ?
          </Link>
        </div>
      </header>

      {/* Main canvas with smooth diagonal wave mesh gradient */}
      <main className="relative flex-1 flex items-center justify-center md:justify-start px-4 py-8 sm:py-12 md:pl-[9%] lg:pl-[11.5%] overflow-hidden bg-[#000000]">
        {/* Flowing diagonal wave backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden select-none bg-[#000000]"
        >
          <svg
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            className="w-full h-full object-cover"
          >
            <defs>
              <filter id="auth-wave-blur-lg" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="68" />
              </filter>
              <filter id="auth-wave-blur-md" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="34" />
              </filter>
              <linearGradient id="auth-purple-wave" x1="0%" y1="85%" x2="100%" y2="5%">
                <stop offset="0%" stopColor="#6D28D9" />
                <stop offset="48%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
              <linearGradient id="auth-magenta-wave" x1="5%" y1="95%" x2="100%" y2="35%">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="45%" stopColor="#E11D74" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>
              <linearGradient id="auth-gold-wave" x1="15%" y1="100%" x2="88%" y2="65%">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="55%" stopColor="#FF9F1C" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>
            </defs>

            {/* Base deep violet-magenta sweeping ribbon */}
            <g filter="url(#auth-wave-blur-lg)">
              <path
                d="M-140,860 C180,680 420,560 760,360 C1040,190 1240,60 1560,-60 L1600,980 L-140,980 Z"
                fill="url(#auth-magenta-wave)"
                opacity="0.95"
              />
              {/* Upper violet crest */}
              <path
                d="M-120,760 C220,560 520,500 880,260 C1120,100 1320,-10 1560,-90 C1380,140 1120,330 820,490 C460,680 180,780 -120,890 Z"
                fill="url(#auth-purple-wave)"
                opacity="0.95"
              />
              {/* Lower warm golden-orange core */}
              <ellipse
                cx="560"
                cy="810"
                rx="540"
                ry="230"
                transform="rotate(-11 560 810)"
                fill="url(#auth-gold-wave)"
              />
              <ellipse
                cx="390"
                cy="850"
                rx="340"
                ry="150"
                fill="#FFE600"
                opacity="0.85"
              />
            </g>

            {/* Luminous soft ridge along the purple wave crest */}
            <g filter="url(#auth-wave-blur-md)">
              <path
                d="M-60,720 C260,550 560,480 930,225 C1150,75 1330,-20 1520,-80"
                stroke="#E9D5FF"
                strokeWidth="44"
                strokeLinecap="round"
                fill="none"
                opacity="0.55"
              />
            </g>
          </svg>
        </div>

        {/* Matte dark card */}
        <div
          className={cn(
            "relative z-10 w-full bg-[#2B2D30]/95 backdrop-blur-md rounded-[8px] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.75)] animate-fade-in",
            wide ? "max-w-[420px]" : "max-w-[356px]"
          )}
        >
          <div className="mb-5">
            <h1 className="text-[22px] font-bold text-white tracking-tight leading-snug">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[#C7C9D1] text-[13px] mt-2 leading-[1.45]">
                {subtitle}
              </p>
            )}
          </div>

          {children}

          {switchText && switchLink && switchLabel && (
            <p className="auth-switch-link mt-4 text-[12px] text-[#C7C9D1] text-center">
              {switchText}{" "}
              <Link
                href={switchLink}
                className="text-[#4CA0FF] hover:text-[#78B7FF] hover:underline font-medium transition-colors"
              >
                {switchLabel}
              </Link>
            </p>
          )}

          {/* Card footer agreement */}
          <div className="mt-6 pt-3.5 border-t border-[#43454A] text-[11px] leading-[1.5] text-[#C7C9D1]">
            Khi tiếp tục, bạn đồng ý với{" "}
            <Link href="/terms" className="text-white underline hover:text-[#4CA0FF]">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="/privacy" className="text-white underline hover:text-[#4CA0FF]">
              Chính sách bảo mật
            </Link>{" "}
            của Bravechat.
          </div>
        </div>
      </main>

      {/* Bottom solid black footer bar */}
      <footer className="relative z-20 bg-[#000000] py-3.5 px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#A8AAB3]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1">
            <span>Copyright © 2026 Bravechat</span>
            <Link href="/docs" className="text-white hover:underline transition-colors">
              Trợ giúp
            </Link>
            <Link href="/status" className="text-white hover:underline transition-colors">
              Trạng thái
            </Link>
            <Link href="/privacy" className="text-white hover:underline transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="text-white hover:underline transition-colors">
              Điều khoản tài khoản
            </Link>
          </div>
          <span className="font-mono text-[11px] text-[#A8AAB3]">
            Build #2026.11
          </span>
        </div>
      </footer>
    </div>
  );
}
