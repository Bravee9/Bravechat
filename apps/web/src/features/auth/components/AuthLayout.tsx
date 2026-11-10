/**
 * components/auth/AuthLayout.tsx
 * Discord-inspired centered modal layout for authentication flows
 */

import Link from "next/link";
import { OceanBackground } from "@/components/ui/OceanBackground";
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
    <div className="relative min-h-screen flex flex-col justify-between w-full overflow-hidden bg-ocean-dark-bg selection:bg-ocean-primary selection:text-white">
      {/* Background canvas */}
      <OceanBackground />

      {/* Top brand header */}
      <header className="relative z-20 p-6 sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <img
            src="/logo-96.png"
            alt="Bravechat"
            width={34}
            height={34}
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-xl text-white tracking-tight">
            Brave<span className="text-ocean-secondary">chat</span>
          </span>
        </Link>
      </header>

      {/* Centered modal container */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10 relative z-10">
        <div
          className={cn(
            "w-full rounded-lg bg-[#0b1d33]/95 border border-white/10 shadow-2xl backdrop-blur-md p-6 sm:p-8 transition-all animate-fade-in",
            sidePanel ? "max-w-[784px]" : "max-w-[480px]"
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
            <div className={cn(sidePanel ? "md:pr-8 md:border-r md:border-white/10" : "")}>
              <div className="mb-6 text-center md:text-left">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {title}
                </h1>
                <p className="text-ocean-light/70 text-sm mt-1.5 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {children}

              {switchText && switchLink && switchLabel && (
                <p className="auth-switch-link mt-4 text-xs sm:text-sm text-ocean-light/60 text-center md:text-left">
                  {switchText}{" "}
                  <Link
                    href={switchLink}
                    className="text-ocean-secondary hover:underline font-medium transition-colors"
                  >
                    {switchLabel}
                  </Link>
                </p>
              )}
            </div>

            {/* Optional QR Code panel (desktop side-by-side) */}
            {sidePanel && (
              <div className="hidden md:flex flex-col items-center justify-center">
                {sidePanel}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer legal disclaimer */}
      <footer className="relative z-10 py-4 px-4 text-center text-xs text-ocean-light/50">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <Link href="/terms" className="underline hover:text-ocean-light/70">
          Điều khoản dịch vụ
        </Link>{" "}
        và{" "}
        <Link href="/privacy" className="underline hover:text-ocean-light/70">
          Chính sách bảo mật
        </Link>{" "}
        của chúng tôi.
      </footer>
    </div>
  );
}
