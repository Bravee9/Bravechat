/**
 * app/(marketing)/docs/page.tsx
 * Trang chủ Tài liệu hướng dẫn — JetBrains Dark Style
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/marketing/docs/DocsLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tài liệu hướng dẫn",
  description:
    "Hướng dẫn sử dụng Bravechat — cách tạo máy chủ, quản lý kênh riêng tư, phân quyền thành viên và tích hợp tự động hóa.",
};

const QUICK_START_STEPS = [
  {
    step: "01",
    title: "Tạo tài khoản hoặc đăng nhập",
    detail:
      "Đăng ký bằng địa chỉ email của bạn và thiết lập tên hiển thị. Bạn có thể bật xác thực hai lớp (2FA) ngay trong phần Cài đặt cá nhân.",
  },
  {
    step: "02",
    title: "Tạo hoặc tham gia máy chủ",
    detail:
      "Tạo không gian riêng cho nhóm bạn, lớp học, cộng đồng hoặc dự án, hoặc tham gia máy chủ có sẵn thông qua mã mời.",
  },
  {
    step: "03",
    title: "Tổ chức danh mục & kênh riêng tư",
    detail:
      "Phân chia kênh văn bản và phòng thoại theo chủ đề. Đặt chế độ Kênh riêng tư cho những nội dung chỉ dành cho các vai trò được chỉ định.",
  },
  {
    step: "04",
    title: "Trò chuyện, họp thoại & quản lý quyền hạn",
    detail:
      "Gửi tin nhắn, chia sẻ tệp đính kèm, tham gia phòng thoại và điều chỉnh quyền hạn chi tiết cho từng thành viên ngay trong giao diện quản trị.",
  },
];

const DOC_CARDS = [
  {
    href: "/docs/architecture",
    badge: "KHÔNG GIAN LÀM VIỆC",
    title: "Tổ chức Không gian & Phân quyền",
    description:
      "Cách bố trí máy chủ, danh mục, kênh riêng tư và bảng phân quyền vai trò (Owner, Admin, Moderator, Member).",
  },
  {
    href: "/docs/api-reference",
    badge: "TÍCH HỢP",
    title: "Giao tiếp & Tích hợp",
    description:
      "Chuẩn kết nối cho ứng dụng khách, thông báo tự động và quản lý tài nguyên máy chủ qua giao diện lập trình.",
  },
  {
    href: "/docs/database-schema",
    badge: "AN TOÀN DỮ LIỆU",
    title: "Cấu trúc Dữ liệu & Bảo mật",
    description:
      "Mô hình thông tin người dùng, máy chủ, kênh, tin nhắn và các nguyên tắc bảo vệ quyền riêng tư.",
  },
];

export default function DocsPage() {
  return (
    <DocsLayout
      title="Tài liệu hướng dẫn"
      description="Hướng dẫn thiết lập không gian trò chuyện, quản lý thành viên, phân quyền truy cập kênh và sử dụng các tính năng trên Bravechat."
    >
      {/* Quick start steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Bắt đầu nhanh
          </h2>
          <span className="text-xs font-mono text-[#7D7D7D]">4 BƯỚC CƠ BẢN</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUICK_START_STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-5 flex flex-col justify-between"
            >
              <div>
                <span className="inline-block font-mono text-xs font-bold text-[#07C3F2] mb-2">
                  {item.step}
                </span>
                <h3 className="text-white font-semibold text-base mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[#A8A8B0] text-sm leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doc cards */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4 tracking-tight">
          Chuyên mục hướng dẫn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DOC_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-[#16161A] border border-[#2B2D30] hover:border-[#087CFA] rounded-[4px] p-6 group transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="inline-block font-mono text-[11px] font-semibold text-[#087CFA] tracking-wider uppercase mb-3">
                  {card.badge}
                </span>
                <h3 className="text-white font-bold text-base mb-2 group-hover:text-[#07C3F2] transition-colors">
                  {card.title}
                </h3>
                <p className="text-[#A8A8B0] text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
              <span className="mt-6 text-xs font-mono text-[#CDCDCD] group-hover:text-white inline-flex items-center gap-1.5">
                Xem chi tiết <span>→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform support */}
      <div className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-6">
        <h3 className="text-white font-semibold text-sm mb-2">
          Nền tảng hỗ trợ
        </h3>
        <p className="text-[#A8A8B0] text-sm leading-relaxed">
          Bravechat hiện hoạt động trực tiếp trên trình duyệt Web. Các phiên bản ứng dụng dành riêng cho Windows, macOS, Linux, Android và iOS đang được phát triển theo lộ trình kế tiếp để đồng bộ trải nghiệm trên mọi thiết bị.
        </p>
      </div>
    </DocsLayout>
  );
}
