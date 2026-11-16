/**
 * app/(marketing)/status/page.tsx
 * Trạng thái Hệ thống / System Status — JetBrains Dark Style
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { FooterSection } from "@/components/marketing/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trạng thái hệ thống",
  description:
    "Theo dõi trạng thái hoạt động của các dịch vụ trên Bravechat: ứng dụng Web, tin nhắn, phòng thoại, lưu trữ tệp và đăng nhập.",
};

const SERVICES = [
  { id: "web", name: "Ứng dụng Web & Giao diện", nameEn: "Web Application", status: "operational" as const },
  { id: "messaging", name: "Hệ thống Tin nhắn & Kênh", nameEn: "Real-time Messaging", status: "operational" as const },
  { id: "voice", name: "Phòng thoại & Chia sẻ màn hình", nameEn: "Voice & Screen Share", status: "operational" as const },
  { id: "media", name: "Lưu trữ Tệp & Hình ảnh", nameEn: "File & Media Uploads", status: "operational" as const },
  { id: "auth", name: "Đăng nhập & Bảo mật tài khoản", nameEn: "Authentication & 2FA", status: "operational" as const },
];

const STATUS_LABELS = {
  operational: {
    vi: "Hoạt động bình thường",
    en: "Operational",
    color: "text-[#21D789]",
    dot: "bg-[#21D789]",
  },
  degraded: {
    vi: "Hiệu suất giảm",
    en: "Degraded Performance",
    color: "text-[#FDB60D]",
    dot: "bg-[#FDB60D]",
  },
};

export default function StatusPage() {
  const overall = STATUS_LABELS.operational;

  return (
    <div className="relative min-h-screen bg-[#0B0B0D] text-[#E6EDF3]">
      <OceanBackground />
      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-24">
        <nav className="flex items-center gap-2 text-xs text-[#7D7D7D] mb-8 font-mono">
          <Link href="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#07C3F2]">Trạng thái hệ thống</span>
        </nav>

        <div className="mb-10 p-6 bg-[#16161A] border border-[#2B2D30] rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className={`w-3.5 h-3.5 rounded-full ${overall.dot}`} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {overall.vi}
              </h1>
              <p className="text-xs font-mono text-[#A8A8B0] mt-0.5">
                Tất cả dịch vụ chính đang vận hành ổn định
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#7D7D7D]">
            {overall.en}
          </span>
        </div>

        <div className="mb-12">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#7D7D7D] mb-3">
            Danh mục dịch vụ
          </h2>
          <div className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] divide-y divide-[#2B2D30]">
            {SERVICES.map((svc) => {
              const cfg = STATUS_LABELS[svc.status];
              return (
                <div
                  key={svc.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#1E1F22] transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{svc.name}</p>
                    <p className="text-[#7D7D7D] text-xs font-mono mt-0.5">
                      {svc.nameEn}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>
                      {cfg.vi}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-6 text-center">
          <p className="text-white font-semibold text-sm">
            Không ghi nhận sự cố gián đoạn gần đây
          </p>
          <p className="text-[#A8A8B0] text-xs mt-1">
            Nếu bạn gặp sự cố khi kết nối hoặc đăng nhập, vui lòng kiểm tra lại kết nối mạng hoặc thử tải lại trang.
          </p>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
