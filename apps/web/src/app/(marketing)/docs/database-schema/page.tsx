/**
 * app/(marketing)/docs/database-schema/page.tsx
 * Cấu trúc Dữ liệu & Bảo mật — JetBrains Dark Style
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/marketing/docs/DocsLayout";

export const metadata: Metadata = {
  title: "Cấu trúc Dữ liệu & Bảo mật",
  description:
    "Mô hình tổ chức dữ liệu tài khoản, máy chủ, kênh, vai trò và tin nhắn trên Bravechat.",
};

const ENTITIES = [
  {
    name: "Tài khoản người dùng (Users)",
    desc: "Lưu trữ thông tin định danh và trạng thái bảo mật cá nhân.",
    fields: [
      ["Tên người dùng & Tên hiển thị", "Định danh duy nhất dùng để kết bạn và hiển thị trong máy chủ"],
      ["Email & Xác thực 2FA", "Dùng để đăng nhập, khôi phục mật khẩu và bảo vệ phiên làm việc"],
      ["Trạng thái hoạt động", "Trực tuyến, Tạm vắng, Không làm phiền hoặc Ẩn"],
    ],
  },
  {
    name: "Máy chủ & Vai trò (Servers & Roles)",
    desc: "Định nghĩa không gian chung, danh sách thành viên và ma trận phân quyền.",
    fields: [
      ["Thông tin máy chủ", "Tên, mô tả, biểu tượng, mã mời và chủ sở hữu"],
      ["Vai trò (Roles)", "Tên vai trò, màu nhận diện, thứ tự ưu tiên và danh sách quyền hạn"],
      ["Thành viên (Members)", "Liên kết người dùng với máy chủ cùng các vai trò được gán"],
    ],
  },
  {
    name: "Danh mục & Kênh (Categories & Channels)",
    desc: "Cấu trúc phân nhóm cuộc trò chuyện và kiểm soát quyền hiển thị.",
    fields: [
      ["Loại kênh", "Kênh văn bản (Text), Kênh thoại (Voice) hoặc Kênh thông báo"],
      ["Chế độ riêng tư", "Cho phép giới hạn kênh chỉ hiển thị với các vai trò được chọn"],
      ["Thứ tự & Danh mục", "Vị trí sắp xếp của kênh trong cây thư mục máy chủ"],
    ],
  },
  {
    name: "Tin nhắn & Tệp đính kèm (Messages & Attachments)",
    desc: "Nội dung trao đổi trong kênh văn bản và tin nhắn trực tiếp.",
    fields: [
      ["Nội dung & Phản hồi", "Văn bản, trích dẫn trả lời, trạng thái ghim và lịch sử chỉnh sửa"],
      ["Tệp đính kèm", "Hình ảnh, tài liệu được kiểm tra định dạng an toàn trước khi lưu trữ"],
      ["Thu hồi dữ liệu", "Tin nhắn đã xóa không còn hiển thị với các thành viên khác"],
    ],
  },
];

export default function DatabaseSchemaPage() {
  return (
    <DocsLayout
      title="Cấu trúc Dữ liệu & Bảo mật"
      description="Cách thông tin tài khoản, máy chủ, phân quyền và tin nhắn được tổ chức để đảm bảo tính nhất quán và quyền riêng tư."
    >
      <div className="flex flex-col gap-8">
        {ENTITIES.map((entity) => (
          <div
            key={entity.name}
            className="bg-[#16161A] border border-[#2B2D30] rounded-[4px] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#2B2D30] bg-[#18181B]">
              <h2 className="text-base font-bold text-white">{entity.name}</h2>
              <p className="text-[#A8A8B0] text-xs mt-1">{entity.desc}</p>
            </div>
            <div className="divide-y divide-[#2B2D30]">
              {entity.fields.map(([field, detail]) => (
                <div
                  key={field}
                  className="px-5 py-3.5 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-2"
                >
                  <span className="font-mono text-xs font-semibold text-[#07C3F2]">
                    {field}
                  </span>
                  <span className="text-sm text-[#A8A8B0]">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DocsLayout>
  );
}
