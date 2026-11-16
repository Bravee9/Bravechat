/**
 * app/(marketing)/docs/api-reference/page.tsx
 * Giao tiếp & Tích hợp — JetBrains Dark Style
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/marketing/docs/DocsLayout";

export const metadata: Metadata = {
  title: "Giao tiếp & Tích hợp",
  description:
    "Tài liệu các nhóm đường dẫn giao tiếp cho xác thực, máy chủ, kênh, tin nhắn và quản lý thành viên trên Bravechat.",
};

const ENDPOINTS = [
  {
    group: "Tài khoản & Phiên đăng nhập",
    groupEn: "Authentication",
    items: [
      { method: "POST", path: "/api/auth/register", desc: "Đăng ký tài khoản mới" },
      { method: "POST", path: "/api/auth/login", desc: "Đăng nhập và khởi tạo phiên" },
      { method: "POST", path: "/api/auth/logout", desc: "Đăng xuất phiên hiện tại" },
      { method: "POST", path: "/api/auth/refresh", desc: "Gia hạn phiên đăng nhập" },
      { method: "POST", path: "/api/auth/2fa/setup", desc: "Thiết lập xác thực hai lớp (2FA)" },
      { method: "POST", path: "/api/auth/2fa/disable", desc: "Tắt 2FA (yêu cầu xác minh lại)" },
    ],
  },
  {
    group: "Máy chủ & Thành viên",
    groupEn: "Servers & Members",
    items: [
      { method: "GET", path: "/api/servers", desc: "Danh sách máy chủ của người dùng" },
      { method: "POST", path: "/api/servers", desc: "Tạo máy chủ mới" },
      { method: "PATCH", path: "/api/servers/:serverId", desc: "Cập nhật thông tin máy chủ" },
      { method: "DELETE", path: "/api/servers/:serverId", desc: "Xóa máy chủ (chỉ Chủ sở hữu)" },
      { method: "GET", path: "/api/servers/:serverId/members", desc: "Danh sách thành viên trong máy chủ" },
      { method: "POST", path: "/api/servers/join", desc: "Tham gia máy chủ bằng mã mời" },
    ],
  },
  {
    group: "Kênh & Tin nhắn",
    groupEn: "Channels & Messages",
    items: [
      { method: "GET", path: "/api/servers/:serverId/channels", desc: "Lấy danh sách kênh theo quyền truy cập" },
      { method: "POST", path: "/api/servers/:serverId/channels", desc: "Tạo kênh văn bản hoặc kênh thoại" },
      { method: "GET", path: "/api/channels/:channelId/messages", desc: "Tải lịch sử tin nhắn theo trang" },
      { method: "POST", path: "/api/channels/:channelId/messages", desc: "Gửi tin nhắn hoặc tệp đính kèm" },
      { method: "PATCH", path: "/api/messages/:messageId", desc: "Chỉnh sửa nội dung tin nhắn" },
      { method: "DELETE", path: "/api/messages/:messageId", desc: "Thu hồi tin nhắn" },
    ],
  },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-[#087CFA]/15 text-[#07C3F2] border-[#087CFA]/40",
  POST: "bg-[#21D789]/15 text-[#21D789] border-[#21D789]/40",
  PATCH: "bg-[#FDB60D]/15 text-[#FDB60D] border-[#FDB60D]/40",
  DELETE: "bg-[#FE2857]/15 text-[#FE2857] border-[#FE2857]/40",
};

export default function ApiReferencePage() {
  return (
    <DocsLayout
      title="Giao tiếp & Tích hợp"
      description="Danh mục các điểm kết nối phục vụ đồng bộ dữ liệu máy chủ, kênh, thành viên và tin nhắn."
    >
      <div className="mb-8 p-5 bg-[#16161A] border border-[#2B2D30] rounded-[4px]">
        <p className="text-[#07C3F2] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
          Nguyên tắc xác thực
        </p>
        <p className="text-[#A8A8B0] text-sm leading-relaxed">
          Mọi yêu cầu truy xuất dữ liệu máy chủ, kênh và tin nhắn đều kiểm tra phiên đăng nhập hợp lệ và đối chiếu quyền thành viên trước khi trả về nội dung.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {ENDPOINTS.map((group) => (
          <div key={group.group}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {group.group}
              </h2>
              <p className="text-[#7D7D7D] text-xs font-mono">{group.groupEn}</p>
            </div>
            <div className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] divide-y divide-[#2B2D30]">
              {group.items.map((item) => (
                <div
                  key={`${item.method}-${item.path}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 hover:bg-[#1E1F22] transition-colors"
                >
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border rounded-[2px] w-16 text-center flex-shrink-0 ${
                      METHOD_STYLE[item.method] ?? ""
                    }`}
                  >
                    {item.method}
                  </span>
                  <code className="text-white font-mono text-xs flex-1">
                    {item.path}
                  </code>
                  <span className="text-[#A8A8B0] text-xs sm:text-sm">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DocsLayout>
  );
}
