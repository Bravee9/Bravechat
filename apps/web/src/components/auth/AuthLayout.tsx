/**
 * components/auth/AuthLayout.tsx
 * Shared layout wrapper for login and register pages
 */

import Link from "next/link";
import { OceanBackground } from "@/components/ui/OceanBackground";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  switchText: string;
  switchLink: string;
  switchLabel: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  switchText,
  switchLink,
  switchLabel,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex">
      {/* Ocean background */}
      <OceanBackground />

      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative z-10 border-r border-ocean-dark-border">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group w-fit">
          <div className="w-8 h-8 bg-ocean-primary flex items-center justify-center">
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
          </div>
          <span className="font-bold text-lg text-ocean-light tracking-tight">
            Brave<span className="text-ocean-secondary">chat</span>
          </span>
        </Link>

        {/* Center content */}
        <div className="max-w-md">
          <div className="section-tag mb-8">
            <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block animate-pulse" />
            Real-time · Secure · Scalable
          </div>
          <h1 className="text-5xl font-black text-ocean-light tracking-tighter leading-normal mb-6 py-2">
            GIAO TIẾP
            <br />
            <span className="text-gradient-ocean inline-block pt-1 pb-3">BẮT ĐẦU TỪ ĐÂY</span>
          </h1>
          <p className="text-ocean-light/80 leading-relaxed">
            Tham gia hàng triệu người dùng trên Bravechat — nền tảng giao tiếp
            thời gian thực dành cho cộng đồng, nhóm và bạn bè.
          </p>

          {/* Feature list */}
          <ul className="mt-10 flex flex-col gap-4">
            {[
              "Nhắn tin, giọng nói và video không giới hạn",
              "Mã hóa JWT, bảo mật cấp doanh nghiệp",
              "Lưu trữ media trên Cloudflare R2",
              "Real-time với WebSocket & Redis",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-5 h-5 border border-ocean-primary bg-ocean-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-ocean-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="square"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-ocean-light/80 text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <p className="text-ocean-light/60 text-xs font-mono">
          © {new Date().getFullYear()} Bravechat · Built by Bravee9
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-7 h-7 bg-ocean-primary flex items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" className="w-4 h-4">
              <path d="M4 22C8 16 12 20 16 16C20 12 24 18 28 14" stroke="#D6E8ED" strokeWidth="2.5" strokeLinecap="square" />
            </svg>
          </div>
          <span className="font-bold text-ocean-light">
            Brave<span className="text-ocean-secondary">chat</span>
          </span>
        </Link>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="card-ocean p-8 md:p-10 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-ocean-light tracking-tight">
                {title}
              </h2>
              <p className="text-ocean-light/70 text-sm mt-2">{subtitle}</p>
            </div>

            {/* Form content */}
            {children}

            {/* Switch link */}
            <p className="mt-6 text-center text-ocean-light/60 text-sm">
              {switchText}{" "}
              <Link
                href={switchLink}
                className="text-ocean-secondary font-bold hover:text-ocean-light transition-colors"
              >
                {switchLabel}
              </Link>
            </p>
          </div>

          {/* Legal note */}
          <p className="mt-6 text-center text-ocean-light/60 text-xs leading-relaxed px-4">
            Bằng cách tiếp tục, bạn đồng ý với{" "}
            <Link href="/terms" className="underline hover:text-ocean-light/60">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="/privacy" className="underline hover:text-ocean-light/60">
              Chính sách bảo mật
            </Link>{" "}
            của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}
