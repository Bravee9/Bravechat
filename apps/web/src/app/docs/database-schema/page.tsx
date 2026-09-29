/**
 * app/docs/database-schema/page.tsx
 * Database Schema documentation page
 */

import type { Metadata } from "next";
import { DocsLayout } from "@/components/docs/DocsLayout";

export const metadata: Metadata = {
  title: "Database Schema",
  description: "Cấu trúc cơ sở dữ liệu PostgreSQL của Bravechat — ERD tổng quan và chi tiết từng bảng.",
};

const TABLES = [
  {
    name: "users",
    desc: "Người dùng",
    cols: [
      ["id", "CUID", "Khóa chính"],
      ["username", "VARCHAR(32)", "Duy nhất, chữ thường, chữ-số"],
      ["email", "VARCHAR(254)", "Duy nhất"],
      ["password_hash", "TEXT", "bcrypt hash — mật khẩu gốc không lưu"],
      ["display_name", "VARCHAR(32)?", "Tên hiển thị (có thể khác username)"],
      ["avatar_key", "TEXT?", "Cloudflare R2 object key"],
      ["bio", "VARCHAR(190)?", "Giới thiệu bản thân"],
      ["status", "ENUM", "ONLINE / IDLE / DO_NOT_DISTURB / INVISIBLE / OFFLINE"],
      ["is_email_verified", "BOOLEAN", "Xác thực email"],
      ["is_banned", "BOOLEAN", "Tài khoản bị khóa"],
      ["created_at", "TIMESTAMPTZ", ""],
      ["last_seen_at", "TIMESTAMPTZ?", "Lần cuối hoạt động"],
    ],
  },
  {
    name: "servers",
    desc: "Máy chủ",
    cols: [
      ["id", "CUID", "Khóa chính"],
      ["name", "VARCHAR(100)", "Tên máy chủ"],
      ["description", "VARCHAR(500)?", "Mô tả"],
      ["icon_key", "TEXT?", "R2 object key"],
      ["is_public", "BOOLEAN", "Máy chủ có thể tìm kiếm công khai"],
      ["verification_level", "ENUM", "NONE / LOW / MEDIUM / HIGH / VERY_HIGH"],
      ["owner_id", "CUID", "FK → users.id"],
      ["created_at", "TIMESTAMPTZ", ""],
    ],
  },
  {
    name: "channels",
    desc: "Kênh giao tiếp",
    cols: [
      ["id", "CUID", "Khóa chính"],
      ["server_id", "CUID", "FK → servers.id"],
      ["category_id", "CUID?", "FK → channel_categories.id"],
      ["name", "VARCHAR(100)", "Tên kênh"],
      ["type", "ENUM", "TEXT / VOICE / VIDEO / ANNOUNCEMENT / STAGE / FORUM"],
      ["topic", "VARCHAR(1024)?", "Chủ đề kênh"],
      ["position", "INT", "Thứ tự hiển thị"],
      ["is_nsfw", "BOOLEAN", ""],
      ["slow_mode_delay", "INT", "Giây giữa các tin nhắn"],
      ["bitrate", "INT?", "Chỉ cho VOICE channels (bps)"],
      ["user_limit", "INT?", "Giới hạn người trong VOICE"],
      ["last_message_id", "TEXT?", "ID tin nhắn cuối (cache)"],
    ],
  },
  {
    name: "messages",
    desc: "Tin nhắn",
    cols: [
      ["id", "CUID", "Khóa chính"],
      ["channel_id", "CUID", "FK → channels.id"],
      ["author_id", "CUID", "FK → users.id"],
      ["content", "TEXT?", "Nội dung (nullable khi chỉ có attachment)"],
      ["type", "ENUM", "DEFAULT / REPLY / JOIN / LEAVE / BOOST / SYSTEM"],
      ["is_pinned", "BOOLEAN", ""],
      ["is_deleted", "BOOLEAN", "Soft delete — dữ liệu không bị xóa hoàn toàn"],
      ["reply_to_id", "CUID?", "Self-referential FK (trả lời)"],
      ["nonce", "TEXT?", "Client deduplication ID"],
      ["created_at", "TIMESTAMPTZ", "Được index cùng channel_id"],
      ["edited_at", "TIMESTAMPTZ?", ""],
    ],
  },
  {
    name: "attachments",
    desc: "Tệp đính kèm",
    cols: [
      ["id", "CUID", "Khóa chính"],
      ["message_id", "CUID", "FK → messages.id"],
      ["filename", "VARCHAR(255)", "Tên tệp gốc"],
      ["content_type", "VARCHAR(127)", "MIME type"],
      ["size", "INT", "Kích thước (bytes)"],
      ["r2_key", "TEXT", "Cloudflare R2 object key"],
      ["width", "INT?", "Cho ảnh/video"],
      ["height", "INT?", "Cho ảnh/video"],
      ["duration", "FLOAT?", "Cho âm thanh/video (giây)"],
      ["type", "ENUM", "IMAGE / VIDEO / AUDIO / FILE / GIF"],
    ],
  },
  {
    name: "direct_messages",
    desc: "Tin nhắn trực tiếp (DM)",
    cols: [
      ["id", "CUID", "Khóa chính"],
      ["sender_id", "CUID", "FK → users.id"],
      ["receiver_id", "CUID", "FK → users.id"],
      ["content", "TEXT?", "Nội dung"],
      ["is_read", "BOOLEAN", "Đã đọc"],
      ["is_deleted", "BOOLEAN", "Soft delete"],
      ["r2_key", "TEXT?", "File attachment (nếu có)"],
      ["created_at", "TIMESTAMPTZ", "Được index cùng sender+receiver"],
    ],
  },
];

export default function DatabaseSchemaPage() {
  return (
    <DocsLayout
      title="Database Schema"
      description="Cấu trúc cơ sở dữ liệu PostgreSQL của Bravechat. Quản lý qua Prisma ORM với migrations."
    >
      {/* ERD Overview */}
      <div className="mb-12">
        <div className="mb-5">
          <h2 className="text-xl font-black text-ocean-light tracking-tight">ERD Tổng quan</h2>
          <p className="text-ocean-secondary text-xs italic mt-0.5 font-mono">Entity-Relationship Overview</p>
          <div className="mt-3 h-px bg-ocean-dark-border" />
        </div>
        <pre className="bg-[#030C10] border border-ocean-dark-border p-4 overflow-x-auto text-xs font-mono text-ocean-secondary leading-relaxed">
{`users ──< server_members >── servers ──< channels ──< messages
                                    ──< roles ─────< member_roles
                                    ──< channel_categories
                                    ──< server_invites

messages ──< attachments
         ──< message_reactions
         ──< message_embeds
         ──< messages (self-ref: replies)

users ──< direct_messages
     ──< friendships
     ──< refresh_tokens`}
        </pre>
      </div>

      {/* Tables */}
      {TABLES.map((table) => (
        <div key={table.name} className="mb-12">
          <div className="mb-5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-black text-ocean-light tracking-tight font-mono">{table.name}</h2>
              <span className="text-ocean-secondary text-sm italic">— {table.desc}</span>
            </div>
            <div className="mt-3 h-px bg-ocean-dark-border" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border border-ocean-dark-border text-sm">
              <thead>
                <tr className="bg-ocean-dark-surface">
                  {["Cột / Column", "Kiểu dữ liệu / Type", "Mô tả / Description"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2 text-ocean-secondary text-xs font-bold uppercase tracking-wider border-b border-ocean-dark-border"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.cols.map(([col, type, desc]) => (
                  <tr
                    key={col}
                    className="border-b border-ocean-dark-border hover:bg-ocean-dark-surface/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-ocean-secondary font-bold text-xs">{col}</td>
                    <td className="px-4 py-2.5 font-mono text-ocean-light/70 text-xs">{type}</td>
                    <td className="px-4 py-2.5 text-ocean-light/60 text-xs">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Indexes */}
      <div className="mb-12">
        <div className="mb-5">
          <h2 className="text-xl font-black text-ocean-light tracking-tight">Indexes quan trọng</h2>
          <p className="text-ocean-secondary text-xs italic mt-0.5 font-mono">Key Indexes</p>
          <div className="mt-3 h-px bg-ocean-dark-border" />
        </div>
        <pre className="bg-[#030C10] border border-ocean-dark-border p-4 overflow-x-auto text-xs font-mono text-ocean-secondary leading-relaxed">
{`-- Tin nhắn trong kênh (cursor pagination)
CREATE INDEX idx_messages_channel_created
  ON messages(channel_id, created_at);

-- Lịch sử DM
CREATE INDEX idx_dm_sender_receiver_created
  ON direct_messages(sender_id, receiver_id, created_at);

-- Refresh token lookup
CREATE INDEX idx_refresh_tokens_user
  ON refresh_tokens(user_id);`}
        </pre>
      </div>

      {/* Prisma commands */}
      <div className="mb-12">
        <div className="mb-5">
          <h2 className="text-xl font-black text-ocean-light tracking-tight">Lệnh Prisma</h2>
          <p className="text-ocean-secondary text-xs italic mt-0.5 font-mono">Prisma Commands</p>
          <div className="mt-3 h-px bg-ocean-dark-border" />
        </div>
        <pre className="bg-[#030C10] border border-ocean-dark-border p-4 overflow-x-auto text-xs font-mono text-ocean-secondary leading-relaxed">
{`# Di chuyển vào thư mục database
cd packages/database

# Tạo migration mới
pnpm prisma migrate dev --name <tên_migration>

# Áp dụng migration lên môi trường production
pnpm prisma migrate deploy

# Reset cơ sở dữ liệu (CHỈ môi trường DEV)
pnpm prisma migrate reset

# Mở Prisma Studio (GUI)
pnpm prisma studio

# Chạy seed dữ liệu mẫu
pnpm prisma db seed`}
        </pre>
      </div>
    </DocsLayout>
  );
}
