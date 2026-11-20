/**
 * app/(marketing)/docs/database-schema/page.tsx
 * Quyền riêng tư & An toàn Dữ liệu
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/marketing/docs/DocsLayout";

export const metadata: Metadata = {
  title: "Quyền riêng tư & An toàn Dữ liệu",
  description:
    "Cách Bravechat bảo vệ thông tin tài khoản, không gian máy chủ, kênh riêng tư và tệp đính kèm của người dùng.",
};

const DATA_PILLARS = [
  {
    name: "Bảo vệ Thông tin Tài khoản",
    desc: "Dữ liệu định danh được tối giản hóa và bảo vệ bằng nhiều lớp xác thực.",
    fields: [
      ["Mật khẩu & Khóa xác thực", "Mật khẩu luôn được băm một chiều; mã xác nhận một lần (OTP) chỉ có hiệu lực trong thời gian ngắn."],
      ["Nhật ký Bảo mật cá nhân", "Ghi nhận lịch sử đăng nhập, đổi mật khẩu và thiết lập 2FA để bạn chủ động kiểm soát tài khoản."],
      ["Trạng thái hiển thị", "Tùy chỉnh trạng thái Trực tuyến, Tạm vắng, Không làm phiền hoặc Ẩn theo nhu cầu cá nhân."],
    ],
  },
  {
    name: "Cô lập Không gian Máy chủ & Kênh riêng tư",
    desc: "Nội dung của từng máy chủ và kênh riêng tư được tách biệt theo danh sách thành viên.",
    fields: [
      ["Quyền truy cập máy chủ", "Chỉ những thành viên đã tham gia máy chủ mới có thể xem danh sách kênh và lịch sử trò chuyện."],
      ["Kênh riêng tư theo vai trò", "Chủ máy chủ và Quản trị viên có thể giới hạn kênh chỉ hiển thị với các vai trò được chỉ định."],
      ["Thu hồi quyền tức thì", "Khi thành viên rời máy chủ hoặc bị thu hồi vai trò, kết nối thời gian thực tới kênh đó sẽ đóng ngay lập tức."],
    ],
  },
  {
    name: "An toàn Tệp đính kèm & Phương tiện",
    desc: "Mọi tệp tải lên đều được kiểm tra định dạng trước khi lưu trữ và phân phối.",
    fields: [
      ["Kiểm tra chữ ký tệp (Magic Bytes)", "Đối chiếu định dạng thực tế của hình ảnh và tệp đính kèm, ngăn chặn tệp giả mạo phần mở rộng."],
      ["Giới hạn dung lượng an toàn", "Bảo vệ hiệu năng trình duyệt và máy chủ trước các tệp tải lên vượt ngưỡng cho phép."],
      ["Liên kết truy cập có kiểm soát", "Tệp đính kèm trong kênh chỉ được cấp đường dẫn tải cho thành viên có quyền xem kênh."],
    ],
  },
];

export default function DatabaseSchemaPage() {
  return (
    <DocsLayout
      title="Quyền riêng tư & An toàn Dữ liệu"
      description="Các nguyên tắc bảo vệ tài khoản, kiểm soát quyền truy cập kênh riêng tư và đảm bảo an toàn khi chia sẻ tệp trên Bravechat."
    >
      <div className="flex flex-col gap-8">
        {DATA_PILLARS.map((entity) => (
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
