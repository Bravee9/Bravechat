/**
 * app/(marketing)/changelog/page.tsx
 * Nhật ký thay đổi / Changelog — JetBrains Dark Style
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { FooterSection } from "@/components/marketing/landing/FooterSection";
import { OceanBackground } from "@/components/ui/OceanBackground";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nhật ký cập nhật",
  description:
    "Nhật ký cập nhật của Bravechat — tổng hợp các cải tiến giao diện, tính năng quản trị máy chủ và bảo mật.",
};

const ENTRIES = [
  {
    version: "0.4.0",
    date: "16/11/2026",
    tag: "Cập nhật lớn",
    changes: {
      added: [
        "Giao diện không gian làm việc tối giản, hiện đại với bảng màu nhận diện rõ ràng",
        "Trung tâm quản trị máy chủ tích hợp: chỉnh sửa thông tin máy chủ, quản lý kênh, thành viên và ma trận phân quyền vai trò (RBAC)",
        "Chế độ Kênh riêng tư (Private Channel) kèm màn hình bảo vệ khi người dùng không đủ quyền truy cập",
        "Yêu cầu xác minh lại mật khẩu hoặc mã xác thực khi tắt bảo mật hai lớp (2FA)",
      ],
      changed: [
        "Đồng bộ bộ nhận diện thương hiệu Bravechat trên thanh điều hướng, chân trang và các trang đăng nhập",
        "Giữ nguyên vị trí cuộn của thanh danh sách máy chủ khi chuyển đổi giữa các máy chủ ở cuối danh sách",
        "Viết lại toàn bộ nội dung trang chủ và các trang thông tin theo văn phong ngắn gọn, rõ ràng, hướng tới người dùng",
      ],
    },
  },
  {
    version: "0.3.0",
    date: "28/09/2026",
    tag: "Tính năng",
    changes: {
      added: [
        "Trang Điều khoản dịch vụ, Chính sách bảo mật và Chính sách Cookie hỗ trợ song ngữ Việt - Anh",
        "Trang Lộ trình phát triển, Trạng thái dịch vụ và Tài liệu hướng dẫn sử dụng",
        "Luồng khôi phục mật khẩu và xác thực tài khoản qua email",
      ],
      changed: [
        "Cải thiện bố cục phản hồi trên màn hình máy tính và thiết bị di động",
      ],
    },
  },
  {
    version: "0.2.0",
    date: "21/09/2026",
    tag: "Khởi tạo",
    changes: {
      added: [
        "Hệ thống máy chủ, danh mục kênh văn bản, phòng thoại và tin nhắn trực tiếp",
        "Tính năng gửi tệp đính kèm, trả lời tin nhắn, ghim tin nhắn và biểu cảm",
        "Hỗ trợ tạo mã mời tham gia máy chủ và quản lý hồ sơ cá nhân",
      ],
      changed: [],
    },
  },
];

export default function ChangelogPage() {
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
          <span className="text-[#07C3F2]">Nhật ký cập nhật</span>
        </nav>

        <div className="border-b border-[#2B2D30] pb-10 mb-12">
          <p className="font-mono text-xs font-semibold text-[#087CFA] uppercase tracking-wider mb-3">
            PHÁT HÀNH & CẢI TIẾN
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-[-0.03em]">
            Nhật ký cập nhật
          </h1>
          <p className="text-[#A8A8B0] mt-4 leading-relaxed">
            Tổng hợp các tính năng mới, cải tiến giao diện và nâng cấp bảo mật qua từng phiên bản.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {ENTRIES.map((entry) => (
            <article
              key={entry.version}
              className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-6 md:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#2B2D30]">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white font-mono">
                    v{entry.version}
                  </h2>
                  <span className="text-[11px] font-mono font-semibold text-[#07C3F2] bg-[#087CFA]/15 border border-[#087CFA]/40 px-2.5 py-0.5 rounded-[2px]">
                    {entry.tag}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#7D7D7D]">
                  {entry.date}
                </span>
              </div>

              <div className="flex flex-col gap-6">
                {entry.changes.added.length > 0 && (
                  <div>
                    <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#21D789] mb-3">
                      Điểm mới
                    </p>
                    <ul className="flex flex-col gap-2 pl-4 border-l border-[#2B2D30]">
                      {entry.changes.added.map((item) => (
                        <li
                          key={item}
                          className="text-[#E6EDF3] text-sm leading-relaxed"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.changes.changed.length > 0 && (
                  <div>
                    <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#FDB60D] mb-3">
                      Cải tiến
                    </p>
                    <ul className="flex flex-col gap-2 pl-4 border-l border-[#2B2D30]">
                      {entry.changes.changed.map((item) => (
                        <li
                          key={item}
                          className="text-[#A8A8B0] text-sm leading-relaxed"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
