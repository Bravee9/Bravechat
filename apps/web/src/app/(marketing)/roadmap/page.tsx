/**
 * app/(marketing)/roadmap/page.tsx
 * Lộ trình phát triển / Roadmap — JetBrains Dark Style
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { FooterSection } from "@/components/marketing/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lộ trình phát triển",
  description:
    "Lộ trình phát triển của Bravechat — các tính năng đã hoàn thiện trên trình duyệt Web và kế hoạch mở rộng đa nền tảng.",
};

const PHASES = [
  {
    phase: "Giai đoạn 1 · Nền tảng cơ bản",
    period: "Đã hoàn thành",
    status: "completed" as const,
    items: [
      { label: "Đăng ký, đăng nhập và bảo vệ tài khoản hai lớp (2FA)", done: true },
      { label: "Trang chủ, tài liệu hướng dẫn và bộ chính sách pháp lý", done: true },
      { label: "Tạo máy chủ, tham gia qua mã mời và quản lý danh mục kênh", done: true },
      { label: "Nhắn tin văn bản thời gian thực và đính kèm hình ảnh, tài liệu", done: true },
      { label: "Phòng thoại, chia sẻ màn hình và hiển thị trạng thái trực tuyến", done: true },
    ],
  },
  {
    phase: "Giai đoạn 2 · Không gian làm việc & Phân quyền",
    period: "Đang triển khai",
    status: "in-progress" as const,
    items: [
      { label: "Giao diện không gian làm việc tối giản, tập trung hiệu suất cao", done: true },
      { label: "Giữ cố định vị trí cuộn của thanh máy chủ khi chuyển đổi", done: true },
      { label: "Quản trị máy chủ, vai trò (RBAC) và phân quyền chi tiết", done: true },
      { label: "Kênh riêng tư có khóa bảo vệ và kiểm soát quyền truy cập", done: true },
      { label: "Tìm kiếm tin nhắn nâng cao và lọc theo thành viên", done: false },
    ],
  },
  {
    phase: "Giai đoạn 3 · Cộng đồng & Tiện ích mở rộng",
    period: "Kế hoạch tiếp theo",
    status: "planned" as const,
    items: [
      { label: "Chủ đề thảo luận theo nhánh (Threads) trong kênh văn bản", done: false },
      { label: "Tùy chỉnh thông báo riêng cho từng máy chủ và từng kênh", done: false },
      { label: "Tích hợp thông báo tự động (Webhook) cho nhóm làm việc", done: false },
      { label: "Công cụ kiểm duyệt nội dung và nhật ký quản trị (Audit Log)", done: false },
    ],
  },
  {
    phase: "Giai đoạn 4 · Ứng dụng Đa nền tảng",
    period: "Mở rộng thiết bị",
    status: "planned" as const,
    items: [
      { label: "Ứng dụng máy tính cho Windows, macOS và Linux", done: false },
      { label: "Ứng dụng di động cho Android và iOS", done: false },
      { label: "Đồng bộ thông báo đẩy và cuộc gọi thoại giữa Web và thiết bị di động", done: false },
      { label: "Hỗ trợ phím tắt toàn cục và tối ưu âm thanh nền trên máy tính", done: false },
    ],
  },
];

const STATUS_CONFIG = {
  completed: {
    label: "Hoàn thành",
    color: "text-[#21D789]",
    border: "border-[#21D789]/40",
    dot: "bg-[#21D789]",
    bg: "bg-[#16161A]",
  },
  "in-progress": {
    label: "Đang triển khai",
    color: "text-[#07C3F2]",
    border: "border-[#087CFA]/50",
    dot: "bg-[#087CFA]",
    bg: "bg-[#16161A]",
  },
  planned: {
    label: "Kế hoạch",
    color: "text-[#A8A8B0]",
    border: "border-[#2B2D30]",
    dot: "bg-[#7D7D7D]",
    bg: "bg-[#16161A]",
  },
};

export default function RoadmapPage() {
  return (
    <div className="relative min-h-screen bg-[#0B0B0D] text-[#E6EDF3]">
      <OceanBackground />
      <Navbar />

      <main className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[75.6px] pt-12 pb-24">
        <nav className="flex items-center gap-2 text-xs text-[#7D7D7D] mb-8 font-mono">
          <Link href="/" className="hover:text-white transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#07C3F2]">Lộ trình</span>
        </nav>

        <div className="border-b border-[#2B2D30] pb-10 mb-12">
          <p className="font-mono text-xs font-semibold text-[#087CFA] uppercase tracking-wider mb-3">
            LỘ TRÌNH SẢN PHẨM
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em]">
            Lộ trình phát triển
          </h1>
          <p className="text-[#A8A8B0] mt-4 max-w-2xl text-base leading-relaxed">
            Kế hoạch hoàn thiện sản phẩm theo từng giai đoạn — tập trung ổn định trải nghiệm trên trình duyệt Web trước khi phát hành ứng dụng trên Windows, macOS, Linux, Android và iOS.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PHASES.map((phase) => {
            const cfg = STATUS_CONFIG[phase.status];
            const done = phase.items.filter((i) => i.done).length;
            const total = phase.items.length;

            return (
              <div
                key={phase.phase}
                className={`p-7 ${cfg.bg} border border-[#2B2D30] rounded-[4px] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 px-2.5 py-0.5 border rounded-[2px] ${cfg.border} mb-3`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        {phase.phase}
                      </h2>
                      <p className="text-[#7D7D7D] text-xs font-mono mt-1">
                        {phase.period}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xl font-bold text-white">{done}</span>
                      <span className="text-[#7D7D7D]">/{total}</span>
                    </div>
                  </div>

                  <div className="h-1 bg-[#2B2D30] rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full bg-[#087CFA] transition-all duration-500"
                      style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                    />
                  </div>

                  <ul className="flex flex-col gap-3">
                    {phase.items.map((item) => (
                      <li key={item.label} className="flex items-start gap-3">
                        <div
                          className={`w-4 h-4 rounded-[2px] border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            item.done
                              ? "bg-[#087CFA] border-[#087CFA]"
                              : "border-[#393B40] bg-[#1E1F22]"
                          }`}
                        >
                          {item.done && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
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
                          )}
                        </div>
                        <span
                          className={`text-sm leading-relaxed ${
                            item.done ? "text-white" : "text-[#A8A8B0]"
                          }`}
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
