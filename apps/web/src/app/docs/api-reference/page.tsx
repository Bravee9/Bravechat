/**
 * app/docs/api-reference/page.tsx
 * API Reference documentation page
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/docs/DocsLayout";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Tài liệu đầy đủ các endpoint REST API của Bravechat — xác thực, máy chủ, kênh, tin nhắn.",
};

const ENDPOINTS = [
  {
    group: "Xác thực",
    groupEn: "Authentication",
    base: "/auth",
    items: [
      { method: "POST", path: "/auth/register", desc: "Tạo tài khoản mới", status: "planned" },
      { method: "POST", path: "/auth/login", desc: "Đăng nhập, nhận JWT", status: "planned" },
      { method: "POST", path: "/auth/logout", desc: "Đăng xuất, thu hồi token", status: "planned" },
      { method: "POST", path: "/auth/refresh", desc: "Làm mới access token", status: "planned" },
      { method: "POST", path: "/auth/forgot-password", desc: "Gửi email đặt lại mật khẩu", status: "planned" },
      { method: "POST", path: "/auth/reset-password", desc: "Đặt lại mật khẩu với token", status: "planned" },
    ],
  },
  {
    group: "Người dùng",
    groupEn: "Users",
    base: "/users",
    items: [
      { method: "GET", path: "/users/@me", desc: "Lấy thông tin tài khoản hiện tại", status: "planned" },
      { method: "PATCH", path: "/users/@me", desc: "Cập nhật profile", status: "planned" },
      { method: "DELETE", path: "/users/@me", desc: "Xóa tài khoản", status: "planned" },
      { method: "GET", path: "/users/:id", desc: "Xem profile người dùng", status: "planned" },
    ],
  },
  {
    group: "Máy chủ",
    groupEn: "Servers",
    base: "/servers",
    items: [
      { method: "POST", path: "/servers", desc: "Tạo máy chủ mới", status: "planned" },
      { method: "GET", path: "/servers/:id", desc: "Lấy thông tin máy chủ", status: "planned" },
      { method: "PATCH", path: "/servers/:id", desc: "Cập nhật máy chủ", status: "planned" },
      { method: "DELETE", path: "/servers/:id", desc: "Xóa máy chủ (chỉ owner)", status: "planned" },
      { method: "GET", path: "/servers/:id/members", desc: "Danh sách thành viên", status: "planned" },
      { method: "DELETE", path: "/servers/:id/members/:userId", desc: "Kick thành viên", status: "planned" },
    ],
  },
  {
    group: "Kênh",
    groupEn: "Channels",
    base: "/channels",
    items: [
      { method: "POST", path: "/servers/:id/channels", desc: "Tạo kênh mới", status: "planned" },
      { method: "GET", path: "/channels/:id", desc: "Lấy thông tin kênh", status: "planned" },
      { method: "PATCH", path: "/channels/:id", desc: "Cập nhật kênh", status: "planned" },
      { method: "DELETE", path: "/channels/:id", desc: "Xóa kênh", status: "planned" },
    ],
  },
  {
    group: "Tin nhắn",
    groupEn: "Messages",
    base: "/channels/:id/messages",
    items: [
      { method: "GET", path: "/channels/:id/messages", desc: "Lấy lịch sử tin nhắn (pagination)", status: "planned" },
      { method: "POST", path: "/channels/:id/messages", desc: "Gửi tin nhắn mới", status: "planned" },
      { method: "PATCH", path: "/channels/:id/messages/:msgId", desc: "Chỉnh sửa tin nhắn", status: "planned" },
      { method: "DELETE", path: "/channels/:id/messages/:msgId", desc: "Xóa tin nhắn", status: "planned" },
    ],
  },
  {
    group: "Liên kết mời",
    groupEn: "Invites",
    base: "/invites",
    items: [
      { method: "POST", path: "/channels/:id/invites", desc: "Tạo liên kết mời", status: "planned" },
      { method: "GET", path: "/invites/:code", desc: "Lấy thông tin mời", status: "planned" },
      { method: "POST", path: "/invites/:code/join", desc: "Tham gia qua liên kết mời", status: "planned" },
      { method: "DELETE", path: "/invites/:code", desc: "Thu hồi liên kết mời", status: "planned" },
    ],
  },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-ocean-secondary/20 text-ocean-secondary border-ocean-secondary/30",
  POST: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PATCH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  PUT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function ApiReferencePage() {
  return (
    <DocsLayout
      title="API Reference"
      description="Tài liệu đầy đủ các endpoint REST API của Bravechat. Tất cả endpoints đang trong giai đoạn phát triển."
    >
      {/* Base URL */}
      <div className="mb-10 p-4 bg-ocean-dark-surface border border-ocean-dark-border">
        <p className="text-ocean-secondary text-xs font-bold uppercase tracking-wider mb-2">Base URL</p>
        <code className="text-ocean-light font-mono text-sm">http://localhost:4000/api</code>
        <p className="text-ocean-light/50 text-xs font-mono mt-1">Production: https://api.bravechat.app</p>
      </div>

      {/* Auth header note */}
      <div className="mb-10 p-4 border-l-2 border-ocean-primary/60 bg-ocean-dark-surface/50">
        <p className="text-ocean-secondary text-xs font-bold uppercase tracking-wider mb-2">Xác thực / Authentication</p>
        <p className="text-ocean-light/70 text-sm mb-2">Phần lớn các endpoint yêu cầu JWT access token trong header:</p>
        <code className="text-ocean-secondary font-mono text-xs bg-[#030C10] border border-ocean-dark-border px-3 py-2 block">
          Authorization: Bearer &lt;access_token&gt;
        </code>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-4 mb-10">
        {[
          { label: "Hoàn thành", en: "Implemented", dot: "bg-emerald-500" },
          { label: "Đang phát triển", en: "In Progress", dot: "bg-ocean-secondary animate-pulse" },
          { label: "Kế hoạch", en: "Planned", dot: "bg-ocean-light/30" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 ${s.dot}`} />
            <span className="text-ocean-light/70 text-xs">{s.label} <span className="text-ocean-light/40">/ {s.en}</span></span>
          </div>
        ))}
      </div>

      {/* Endpoint groups */}
      <div className="flex flex-col gap-12">
        {ENDPOINTS.map((group) => (
          <div key={group.group}>
            <div className="mb-4">
              <h2 className="text-lg font-black text-ocean-light tracking-tight">{group.group}</h2>
              <p className="text-ocean-secondary text-xs italic font-mono">{group.groupEn}</p>
              <div className="mt-2 h-px bg-ocean-dark-border" />
            </div>
            <div className="border border-ocean-dark-border divide-y divide-ocean-dark-border">
              {group.items.map((item) => (
                <div key={item.path} className="flex items-center gap-4 px-4 py-3 hover:bg-ocean-dark-surface/40 transition-colors">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border w-14 text-center flex-shrink-0 ${METHOD_STYLE[item.method] ?? ""}`}>
                    {item.method}
                  </span>
                  <code className="text-ocean-light/80 font-mono text-xs flex-1 truncate">{item.path}</code>
                  <span className="text-ocean-light/50 text-sm hidden md:block">{item.desc}</span>
                  <div className="w-2 h-2 bg-ocean-light/30 flex-shrink-0" title="Kế hoạch / Planned" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Example request */}
      <div className="mt-12">
        <h2 className="text-lg font-black text-ocean-light mb-2 tracking-tight">Ví dụ Yêu cầu</h2>
        <p className="text-ocean-secondary text-xs italic font-mono mb-4">Example Request</p>
        <div className="h-px bg-ocean-dark-border mb-6" />
        <p className="text-ocean-light/70 text-sm mb-3">POST /auth/register</p>
        <pre className="bg-[#030C10] border border-ocean-dark-border p-4 overflow-x-auto text-xs font-mono text-ocean-secondary leading-relaxed">
{`curl -X POST https://api.bravechat.app/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "username": "nguyen_minh",
    "displayName": "Nguyễn Minh",
    "password": "SecurePass123!"
  }'

# Response 201:
{
  "statusCode": 201,
  "message": "Tài khoản đã được tạo thành công.",
  "data": {
    "id": "cuid...",
    "email": "user@example.com",
    "username": "nguyen_minh",
    "displayName": "Nguyễn Minh",
    "createdAt": "2026-09-28T00:00:00.000Z"
  }
}`}
        </pre>
      </div>
    </DocsLayout>
  );
}
