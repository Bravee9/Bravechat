/**
 * app/thank-you/page.tsx
 * Trang cảm ơn sau khi đăng ký thành công.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { OceanBackground } from "@/components/ui/OceanBackground";

export const metadata: Metadata = {
  title: "Cảm ơn bạn đã đăng ký",
  description: "Tài khoản Bravechat của bạn đã được tạo. Đăng nhập để bắt đầu trò chuyện.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <OceanBackground />
      <div className="relative z-10 flex max-w-md flex-col items-center text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center border border-ocean-primary/50 bg-ocean-primary/20">
          <svg
            className="h-8 w-8 text-ocean-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="square" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-black tracking-tight text-ocean-light md:text-4xl">
          Cảm ơn bạn đã đăng ký!
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ocean-light/80">
          Tài khoản Bravechat của bạn đã được tạo. Đăng nhập để tạo máy chủ đầu tiên
          hoặc tham gia cộng đồng của bạn.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/login?registered=true"
            id="thank-you-login"
            className="btn-primary px-8 py-3.5 text-center text-xs"
          >
            Đăng nhập ngay
          </Link>
          <Link
            href="/"
            id="thank-you-home"
            className="btn-secondary px-8 py-3.5 text-center text-xs"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
