/**
 * app/(marketing)/docs/architecture/page.tsx
 * Tổ chức Không gian & Phân quyền — JetBrains Dark Style
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/marketing/docs/DocsLayout";

export const metadata: Metadata = {
  title: "Tổ chức Không gian & Phân quyền",
  description:
    "Cách tổ chức máy chủ, danh mục, kênh riêng tư và hệ thống phân quyền vai trò trên Bravechat.",
};

export default function ArchitecturePage() {
  return (
    <DocsLayout
      title="Tổ chức Không gian & Phân quyền"
      description="Mô hình tổ chức máy chủ, kênh giao tiếp và cơ chế kiểm soát quyền truy cập giúp bảo vệ không gian chung của bạn."
    >
      <DocSection
        title="Bố cục 3 lớp trong không gian làm việc"
        subtitle="Workspace Layout"
      >
        <p className="text-[#A8A8B0] text-sm leading-relaxed mb-4">
          Giao diện làm việc của Bravechat được chia thành ba vùng độc lập để giữ nguyên vị trí cuộn và trạng thái làm việc khi bạn di chuyển giữa nhiều máy chủ hoặc nhiều kênh:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              layer: "Lớp 1 · Thanh Máy chủ",
              title: "Danh sách máy chủ & tin nhắn trực tiếp",
              detail:
                "Cố định bên trái màn hình. Giữ nguyên vị trí cuộn khi bạn chuyển đổi qua lại giữa hàng chục máy chủ khác nhau.",
            },
            {
              layer: "Lớp 2 · Cây Kênh & Danh mục",
              title: "Cấu trúc kênh theo từng máy chủ",
              detail:
                "Hiển thị danh mục kênh văn bản, kênh thoại, trạng thái khóa của kênh riêng tư và thanh điều khiển âm thanh cá nhân.",
            },
            {
              layer: "Lớp 3 · Khung Hội thoại & Quản trị",
              title: "Nội dung kênh và các tab công cụ",
              detail:
                "Hỗ trợ chuyển nhanh giữa tab trò chuyện, bảng thành viên và cửa sổ thiết lập máy chủ hoặc phân quyền.",
            },
          ].map((item) => (
            <div
              key={item.layer}
              className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-5"
            >
              <p className="text-[#07C3F2] text-xs font-mono font-semibold uppercase mb-1.5">
                {item.layer}
              </p>
              <p className="text-white font-semibold text-sm mb-2">
                {item.title}
              </p>
              <p className="text-[#A8A8B0] text-xs leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Hệ thống Vai trò & Phân quyền (RBAC)"
        subtitle="Role-Based Access Control"
      >
        <p className="text-[#A8A8B0] text-sm leading-relaxed mb-4">
          Mỗi máy chủ có thể thiết lập nhiều vai trò với màu sắc nhận diện và bộ quyền hạn riêng biệt:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              role: "Chủ sở hữu (Owner)",
              color: "#FE2857",
              desc: "Toàn quyền quản lý máy chủ, xóa máy chủ, chuyển nhượng quyền sở hữu và cấu hình mọi vai trò.",
            },
            {
              role: "Quản trị viên (Admin)",
              color: "#087CFA",
              desc: "Quản lý cài đặt máy chủ, tạo hoặc xóa kênh, quản lý vai trò và duyệt thành viên.",
            },
            {
              role: "Điều hành viên (Moderator)",
              color: "#21D789",
              desc: "Giữ trật tự cuộc trò chuyện, ghim tin nhắn, quản lý nội dung và hỗ trợ thành viên mới.",
            },
            {
              role: "Thành viên (Member)",
              color: "#CDCDCD",
              desc: "Truy cập các kênh chung, gửi tin nhắn, tải tệp đính kèm và tham gia phòng thoại.",
            },
          ].map((item) => (
            <div
              key={item.role}
              className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-4 flex items-start gap-3.5"
            >
              <span
                className="w-3 h-3 rounded-xs shrink-0 mt-1"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-white font-semibold text-sm">{item.role}</p>
                <p className="text-[#A8A8B0] text-xs mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Bảo vệ Kênh riêng tư & Kiểm soát truy cập"
        subtitle="Channel Privacy & Access Guard"
      >
        <div className="flex flex-col gap-3">
          {[
            {
              title: "Kênh riêng tư (Private Channels)",
              detail:
                "Khi một kênh được bật chế độ riêng tư, chỉ những thành viên có vai trò nằm trong danh sách cho phép mới nhìn thấy nội dung và lịch sử tin nhắn của kênh đó.",
            },
            {
              title: "Chặn truy cập qua liên kết trực tiếp",
              detail:
                "Nếu người dùng mở trực tiếp đường dẫn URL của một máy chủ hoặc kênh mà họ chưa tham gia hoặc không đủ quyền, hệ thống sẽ ẩn toàn bộ nội dung và hiển thị màn hình thông báo giới hạn quyền truy cập.",
            },
            {
              title: "Xác thực lại cho thao tác nhạy cảm",
              detail:
                "Các thao tác thay đổi bảo mật tài khoản như tắt xác thực hai lớp (2FA) hoặc xóa máy chủ đều yêu cầu bước xác nhận bổ sung.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 bg-[#16161A] border border-[#2B2D30] rounded-[4px] p-4"
            >
              <div className="w-2 h-2 bg-[#087CFA] flex-shrink-0 mt-1.5" />
              <div>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-[#A8A8B0] text-sm mt-1 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DocSection>
    </DocsLayout>
  );
}

function DocSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-12">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-[#7D7D7D] text-xs font-mono mt-0.5">{subtitle}</p>
        <div className="mt-3 h-px bg-[#2B2D30]" />
      </div>
      {children}
    </div>
  );
}
