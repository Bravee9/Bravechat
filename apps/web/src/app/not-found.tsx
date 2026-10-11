/**
 * app/not-found.tsx
 * Trang 404 tùy chỉnh — đứng riêng, có logo, một nút chính về trang chủ.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { OceanBackground } from "@/components/ui/OceanBackground";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  description: "Trang bạn tìm không tồn tại hoặc đã được di chuyển.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <OceanBackground />
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <Link href="/" className="mb-10 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-96.png"
            alt="Logo Bravechat"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-ocean-light">
            Brave<span className="text-ocean-secondary">chat</span>
          </span>
        </Link>

        <p className="text-sm font-medium tabular-nums text-ocean-secondary">404</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ocean-light md:text-4xl">
          Không tìm thấy trang
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ocean-light/80">
          Đường dẫn có thể bị gõ sai, hoặc trang đã được di chuyển. Quay về trang
          chủ để tiếp tục.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            id="not-found-home"
            className="btn-primary px-8 py-3.5 text-center text-xs"
          >
            Về trang chủ
          </Link>
          <Link
            href="/docs"
            id="not-found-docs"
            className="btn-secondary px-8 py-3.5 text-center text-xs"
          >
            Xem tài liệu
          </Link>
        </div>
      </div>
    </main>
  );
}
