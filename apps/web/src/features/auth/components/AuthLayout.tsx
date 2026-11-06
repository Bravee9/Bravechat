/**
 * components/auth/AuthLayout.tsx
 * Shared layout wrapper for login, register, and password recovery pages
 */

import Link from "next/link";
import { OceanBackground } from "@/components/ui/OceanBackground";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  switchText?: string;
  switchLink?: string;
  switchLabel?: string;
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
    <div className="relative min-h-screen flex w-full overflow-hidden bg-ocean-dark-bg">
      {/* Ocean background */}
      <OceanBackground />

      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative z-10 border-r border-white/5 bg-ocean-dark-bg/40 backdrop-blur-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group w-fit mb-8">
          <img src="/logo-96.png" alt="Logo Bravechat" width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="font-bold text-2xl text-ocean-light tracking-tight">
            Brave<span className="text-ocean-secondary">chat</span>
          </span>
        </Link>

        {/* Center content */}
        <div className="max-w-md">
          <div className="section-tag mb-6">
            <span className="w-1.5 h-1.5 bg-ocean-secondary inline-block animate-pulse" />
            Real-time · Secure · Scalable
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-ocean-light tracking-tighter leading-tight mb-5">
            GIAO TIẾP
            <br />
            <span className="text-gradient-ocean">BẮT ĐẦU TỪ ĐÂY</span>
          </h1>
          <p className="text-ocean-light/80 leading-relaxed text-sm xl:text-base">
            Tham gia hàng triệu người dùng trên Bravechat — nền tảng giao tiếp
            thời gian thực dành cho cộng đồng, nhóm và bạn bè.
          </p>
        </div>

        {/* Bottom */}
        <p className="text-ocean-light/60 text-xs font-mono">
          © {new Date().getFullYear()} Bravechat · Built by Bravee9
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 relative z-10 overflow-y-auto min-h-screen">
        {/* Mobile logo */}
        <Link href="/" className="flex justify-center items-center gap-3 mb-6 sm:mb-8 lg:hidden group">
          <img src="/logo-96.png" alt="Logo Bravechat" width={36} height={36} className="w-9 h-9 object-contain" />
          <span className="font-bold text-xl text-ocean-light tracking-tight">
            Brave<span className="text-ocean-secondary">chat</span>
          </span>
        </Link>

        <div className="w-full max-w-md my-auto">
          {/* Card */}
          <div className="bg-ocean-dark-surface/60 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 p-6 sm:p-8 md:p-9 animate-fade-in rounded-xl">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-ocean-light tracking-tight">
                {title}
              </h2>
              <p className="text-ocean-light/70 text-xs sm:text-sm mt-1.5 leading-relaxed">{subtitle}</p>
            </div>

            {/* Form content */}
            {children}

            {/* Switch link */}
            {switchText && switchLink && switchLabel && (
              <p className="auth-switch-link mt-5 text-center text-ocean-light/60 text-xs sm:text-sm">
                {switchText}{" "}
                <Link
                  href={switchLink}
                  className="text-ocean-secondary font-bold hover:text-ocean-light transition-colors"
                >
                  {switchLabel}
                </Link>
              </p>
            )}
          </div>

          {/* Legal note */}
          <p className="mt-4 text-center text-ocean-light/50 text-[11px] sm:text-xs leading-relaxed px-4">
            Bằng cách tiếp tục, bạn đồng ý với{" "}
            <Link href="/terms" className="underline hover:text-ocean-light/70">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="/privacy" className="underline hover:text-ocean-light/70">
              Chính sách bảo mật
            </Link>{" "}
            của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
}
