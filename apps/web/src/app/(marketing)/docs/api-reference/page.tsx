/**
 * app/(marketing)/docs/api-reference/page.tsx
 * Bảo mật Tài khoản & Tích hợp Thông báo
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/marketing/docs/DocsLayout";

export const metadata: Metadata = {
  title: "Bảo mật Tài khoản & Tích hợp",
  description:
    "Hướng dẫn các phương thức xác thực an toàn, quản lý phiên đăng nhập và đồng bộ thông báo trên Bravechat.",
};

const SECURITY_CAPABILITIES = [
  {
    group: "Phương thức Đăng nhập & Xác thực",
    subtitle: "Authentication & Verification",
    items: [
      {
        badge: "MẬT KHẨU",
        title: "Đăng nhập tiêu chuẩn kết hợp chống dò mật khẩu",
        desc: "Hỗ trợ đăng nhập bằng email hoặc tên người dùng kèm cơ chế tự động giới hạn tần suất khi phát hiện nhiều lần thử sai liên tiếp.",
      },
      {
        badge: "MÃ OTP",
        title: "Xác thực một lần qua Email (6 chữ số)",
        desc: "Nhận mã xác nhận 6 chữ số có thời hạn ngắn trực tiếp qua hộp thư cá nhân để đăng nhập nhanh hoặc khôi phục quyền truy cập.",
      },
      {
        badge: "2FA TOTP",
        title: "Xác thực hai yếu tố & Mã dự phòng",
        desc: "Kết nối ứng dụng tạo mã xác thực (Authenticator) trên điện thoại kèm 6 mã khôi phục dự phòng dùng một lần.",
      },
      {
        badge: "MÃ QR",
        title: "Phê duyệt đăng nhập từ thiết bị tin cậy",
        desc: "Quét mã QR và kiểm tra thông tin trình duyệt trước khi cấp quyền đăng nhập cho máy tính mới.",
      },
    ],
  },
  {
    group: "Quản lý Phiên & Bảo vệ Không gian chung",
    subtitle: "Session Control & Workspace Protection",
    items: [
      {
        badge: "PHIÊN",
        title: "Theo dõi và thu hồi thiết bị từ xa",
        desc: "Xem danh sách các thiết bị đang đăng nhập và thu hồi quyền truy cập của bất kỳ phiên nào ngay trong phần Cài đặt Bảo mật.",
      },
      {
        badge: "TỰ ĐỘNG",
        title: "Thu hồi toàn bộ phiên cũ khi đổi mật khẩu",
        desc: "Khi đặt lại hoặc thay đổi mật khẩu, mọi phiên đăng nhập và kết nối thời gian thực trên các thiết bị khác đều được đăng xuất tức thì.",
      },
      {
        badge: "PHÂN QUYỀN",
        title: "Kiểm tra quyền thành viên theo thời gian thực",
        desc: "Mọi thao tác xem kênh, gửi tin nhắn và tải tệp đính kèm đều được đối chiếu với vai trò hiện tại của thành viên trong máy chủ.",
      },
    ],
  },
];

export default function ApiReferencePage() {
  return (
    <DocsLayout
      title="Bảo mật Tài khoản & Tích hợp"
      description="Tổng quan các cơ chế xác thực tài khoản, kiểm soát thiết bị đăng nhập và bảo vệ luồng giao tiếp thời gian thực trên Bravechat."
    >
      <div className="mb-8 p-5 bg-[#16161A] border border-[#2B2D30] rounded-[4px]">
        <p className="text-[#07C3F2] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
          Nguyên tắc an toàn mặc định
        </p>
        <p className="text-[#A8A8B0] text-sm leading-relaxed">
          Mọi kết nối giữa trình duyệt và máy chủ đều được mã hóa qua HTTPS/TLS, kết hợp kiểm tra phiên đăng nhập hợp lệ và phân quyền vai trò trước khi truy xuất nội dung kênh.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {SECURITY_CAPABILITIES.map((group) => (
          <div key={group.group}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {group.group}
              </h2>
              <p className="text-[#7D7D7D] text-xs font-mono">{group.subtitle}</p>
            </div>
            <div className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] divide-y divide-[#2B2D30]">
              {group.items.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 px-5 py-4 hover:bg-[#1E1F22] transition-colors"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 border rounded-[2px] w-24 text-center flex-shrink-0 bg-[#087CFA]/15 text-[#07C3F2] border-[#087CFA]/40">
                    {item.badge}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">
                      {item.title}
                    </p>
                    <p className="text-[#A8A8B0] text-xs sm:text-sm mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DocsLayout>
  );
}
