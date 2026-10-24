<p align="center">
  <img src="./apps/web/public/brave-chat.png" alt="Bravechat Logo" width="380" />
</p>

# Bravechat

Bravechat là nền tảng giao tiếp thời gian thực (Real-time Communication Platform) hiệu năng cao dành cho cộng đồng, nhóm làm việc và bạn bè. Dự án được xây dựng theo kiến trúc **Monorepo (Turborepo)** chuẩn doanh nghiệp, áp dụng mô hình **Phân tầng (Layered Architecture)** chặt chẽ và ngôn ngữ thiết kế **Ocean Swiss Minimalist** dịu mắt, tối giản và hiện đại.

**Tác giả**: [Bravee9](https://github.com/Bravee9) & [Shuji7245](https://github.com/Shuji7245)

---

## Kiến trúc Hệ thống Phân tầng (Layered Architecture)

Bravechat phân tách trách nhiệm rõ ràng theo các tầng độc lập để đảm bảo Frontend và Backend phát triển song song mà không bị xung đột, dễ bảo trì và mở rộng quy mô.

```text
┌─────────────────────────────────────────────────────────────────┐
│                 TẦNG HỢP ĐỒNG DÙNG CHUNG (CONTRACTS)             │
│            packages/shared (Domain DTOs, API & WS Events)       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│       TẦNG FRONTEND (WEB)     │         │       TẦNG BACKEND (API)      │
│          apps/web             │         │          apps/api             │
├───────────────────────────────┤         ├───────────────────────────────┤
│ Presentation (Next.js 14)     │         │ Routes & Controllers          │
│ Features & UI Components      │         │ Business Services             │
│ State & Typed Services        │         │ Prisma Repositories           │
│ HTTP Client & WS Realtime     │         │ Plugins (JWT, R2, WS, Redis)  │
└───────────────────────────────┘         └───────────────┬───────────────┘
                                                          ▼
                                          ┌───────────────────────────────┐
                                          │   TẦNG CƠ SỞ DỮ LIỆU & CACHE │
                                          │  PostgreSQL 16 + Redis 7 + R2 │
                                          └───────────────────────────────┘
```

### 1. Tầng Hợp đồng dùng chung (`packages/shared`)
- **Domain DTOs**: `UserSummary`, `CurrentUser`, `ServerListItem`, `ServerDetail`, `Channel`, `DirectConversation`, `Message`.
- **API Envelope**: Chuẩn hóa định dạng phản hồi `{ statusCode, data, message }` và lỗi `{ statusCode, error, message, details }`.
- **API Route Map (`API_ROUTES`)**: Single Source of Truth cho toàn bộ URL endpoint RESTful.
- **Realtime Contracts**: Định nghĩa kiểu dữ liệu sự kiện 2 chiều WebSocket (`ClientEvent` và `ServerEvent`).

### 2. Tầng Ứng dụng Web (`apps/web`)
Áp dụng **Next.js 14 App Router** với Route Groups phân lập và cấu trúc Discord Multi-layered Layout:

- **Route Groups**:
  - `(marketing)`: Landing page, tài liệu (`/docs`), điều khoản (`/terms`, `/privacy`), roadmap (`/roadmap`), trạng thái (`/status`).
  - `(auth)`: Đăng nhập (`/login`), đăng ký (`/register`), quên mật khẩu (`/forgot-password`).
  - `(app)`: Không gian ứng dụng chat Discord (`/channels/*`).
- **Discord 3-Layer Layout (Không reload khi đổi Server/Kênh)**:
  - **Layer 1 - Server Rail (`ServerRail`)**: Cột máy chủ cố định bên trái (`w-[72px]`), đặt tại `app/(app)/channels/layout.tsx`. Nút `@me` ở trên cùng, các icon máy chủ bo squircle mượt mà, pill hiển thị trạng thái active/hover/unread, huy hiệu mention đỏ và tooltip nổi. **Thanh này được giữ cố định (Persistent), không bao giờ bị re-render hay reload lại khi người dùng chuyển server.**
  - **Layer 2 - Channel Sidebar (`ChannelSidebar`)**: Cột danh sách kênh và bạn bè, đặt tại `app/(app)/channels/[serverId]/layout.tsx`. Tự động tải category, kênh voice/text, tin nhắn trực tiếp và thanh User Profile Bar dưới cùng (mic, tai nghe, cài đặt).
  - **Layer 3 - Main Chat View (`ChatView`)**: Khu vực trò chuyện chính, đặt tại `app/(app)/channels/[serverId]/[channelId]/page.tsx`. Kết nối WebSocket thời gian thực theo room kênh, hiển thị danh sách tin nhắn, typing indicator và cột thành viên bên phải (`MemberList`) có thể bật/tắt.
- **Cấu trúc Thư mục Nội bộ `apps/web/src`**:
  - `config/`: Cấu hình môi trường tập trung (`env.ts`).
  - `services/`: Tầng giao tiếp mạng (`http.ts`), các service nghiệp vụ (`server.service.ts`, `channel.service.ts`, `user.service.ts`) và bộ dữ liệu mẫu (`services/mock/`).
  - `features/`: Module hóa theo nghiệp vụ (`servers/`, `channels/`, `messages/`, `members/`, `auth/`).
  - `components/`: UI nguyên tử dùng chung (`components/ui/`) và layout marketing (`components/marketing/`).

### 3. Tầng Dịch vụ API Backend (`apps/api`)
- **Fastify Framework**: Xử lý HTTP REST API và WebSocket với tốc độ tối ưu.
- **Kiến trúc Khuyến nghị khi triển khai**:
  - `src/routes/`: Đăng ký endpoint và gắn hook xác thực `server.authenticate`.
  - `src/controllers/`: Nhận request, validate Zod schema, trả về response envelope.
  - `src/services/`: Nghiệp vụ cốt lõi, tương tác với database và pub/sub Redis.
  - `src/plugins/`: `r2.ts` (Cloudflare R2 Object Storage), `websocket.routes.ts` (Realtime chat), JWT, rate-limit.
- **Database & Cache**:
  - **PostgreSQL 16**: Lưu trữ quan hệ Users, Servers, Channels, Messages, Memberships.
  - **Redis 7**: Bộ nhớ đệm phiên, WebSocket Pub/Sub phân tán.
  - **Cloudflare R2**: Lưu trữ file media (ảnh đại diện, banner, tệp đính kèm) qua cơ chế Presigned URL.

---

## Quy trình Phân nhánh Git Doanh nghiệp (Branching Strategy)

Dự án tuân thủ mô hình phân nhánh chuẩn để đảm bảo mã nguồn ổn định:

| Nhánh | Mục đích & Trách nhiệm |
|---|---|
| `main` | Nhánh sản phẩm (Production). Chỉ merge mã nguồn đã được kiểm thử kỹ lưỡng từ `dev`. |
| `dev` | Nhánh tích hợp chính (Staging / Development). Mọi tính năng hoàn thành đều merge vào đây. |
| `feature/*` | Nhánh phát triển tính năng mới (Ví dụ: `feature/api-realtime-websocket`, `feature/voice-chat`). |
| `refactor/*` | Nhánh tái cấu trúc code và kiến trúc (Ví dụ: `refactor/web-layered-architecture`). |
| `chore/*` | Nhánh cấu hình hạ tầng, tooling, thư viện dùng chung (Ví dụ: `chore/shared-contracts`). |
| `fix/*` | Nhánh sửa lỗi phát sinh từ `dev` hoặc hotfix từ `main`. |
| `docs/*` | Nhánh cập nhật tài liệu kỹ thuật, ADR, README. |

---

## Cấu trúc Thư mục Dự án

```text
Bravechat/
├── apps/
│   ├── web/                          # Ứng dụng Next.js 14 Frontend Client (Port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/      # Landing page, docs, changelog, legal
│   │   │   │   ├── (auth)/           # Login, Register, Forgot Password
│   │   │   │   └── (app)/            # Discord-like Chat Workspace
│   │   │   │       └── channels/
│   │   │   │           ├── layout.tsx                # Layer 1: Persistent ServerRail
│   │   │   │           ├── page.tsx                  # Redirect -> /channels/@me
│   │   │   │           └── [serverId]/
│   │   │   │               ├── layout.tsx            # Layer 2: ChannelSidebar
│   │   │   │               ├── page.tsx              # Redirect -> #general
│   │   │   │               └── [channelId]/page.tsx  # Layer 3: ChatView
│   │   │   ├── config/               # Typed environment configuration
│   │   │   ├── services/             # HTTP client seam, API services & Mocks
│   │   │   ├── features/             # Feature-driven UI (servers, channels, messages, members)
│   │   │   ├── components/           # Reusable UI atoms (Tooltip, Button) & Marketing
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   └── lib/                  # Utility helpers & site metadata
│   │   └── package.json
│   │
│   └── api/                          # Máy chủ Fastify REST API & WebSocket (Port 4000)
│       ├── src/
│       │   ├── config/               # Prisma, Redis, Env config
│       │   ├── plugins/              # Fastify plugins (JWT, R2, Cookie, RateLimit)
│       │   ├── routes/               # REST & WebSocket route handlers
│       │   └── index.ts              # Entry point khởi chạy Fastify
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                       # Tầng Hợp đồng dùng chung giữa Web và API
│   │   ├── src/
│   │   │   ├── domain/               # DTOs: User, Server, Channel, Message
│   │   │   ├── api/                  # API_ROUTES map & Response Envelopes
│   │   │   ├── realtime/             # WebSocket event contracts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── database/                     # Tầng Quản lý Cơ sở Dữ liệu Prisma
│       ├── prisma/
│       │   ├── schema.prisma         # PostgreSQL ERD & models
│       │   └── migrations/           # Database schema migrations
│       └── package.json
│
├── docs/                             # Tài liệu kỹ thuật chi tiết
│   ├── adr/                          # Architecture Decision Records (e.g., 001-use-cloudflare-r2)
│   ├── architecture.md               # Thiết kế chi tiết kiến trúc
│   ├── database-schema.md            # Sơ đồ quan hệ bảng (ERD)
│   └── api-reference.md              # Đặc tả REST API & WebSocket events
├── docker-compose.yml                # Cấu hình container (Postgres, Redis, API, Nginx)
├── nginx.conf                        # Reverse proxy config
├── turbo.json                        # Cấu hình Turborepo pipeline
└── pnpm-workspace.yaml               # Cấu hình pnpm monorepo
```

---

## Hướng dẫn Cài đặt & Chạy Dự án

### Yêu cầu Tiên quyết
- **Node.js**: Phiên bản 18.x hoặc 20.x LTS
- **pnpm**: Phiên bản 8.x hoặc cao hơn (`npm i -g pnpm`)
- **Docker & Docker Compose**: Dùng cho PostgreSQL 16 và Redis 7

### 1. Cài đặt Dependencies
Cài đặt toàn bộ workspace monorepo bằng pnpm:
```bash
git clone https://github.com/Bravee9/Bravechat.git
cd Bravechat
pnpm install
```

### 2. Cấu hình Biến Môi trường
Sao chép file `.env.example` thành `.env` ở thư mục gốc:
```bash
cp .env.example .env
```
Điền các giá trị thích hợp cho cơ sở dữ liệu, JWT Secret và thông tin Cloudflare R2:
```env
DATABASE_URL=postgresql://discord_user:discord_secret_2024@localhost:5432/discord_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_jwt_key_that_is_at_least_32_chars_long
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/api/ws
```

### 3. Khởi động Cơ sở Hạ tầng (PostgreSQL & Redis)
Khởi chạy cơ sở dữ liệu qua Docker:
```bash
docker-compose up -d postgres redis
```

### 4. Khởi tạo Cơ sở Dữ liệu với Prisma
Đồng bộ hóa schema và tạo Prisma Client:
```bash
cd packages/database
pnpm prisma migrate dev --name init
pnpm prisma db seed
cd ../..
```

### 5. Chạy Môi trường Phát triển (Development)
Chạy đồng thời cả Frontend và Backend qua Turborepo:
```bash
pnpm dev
```
- **Ứng dụng Web**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:4000](http://localhost:4000)
- **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## Kiểm tra Chất lượng Mã nguồn (Lint & Type-Check)

Quy trình kiểm thử đầy đủ từ cài đặt, Prisma, R2, API, web đến smoke test chức năng nằm tại [docs/testing-workflow.md](./docs/testing-workflow.md). Nên chạy theo checklist này trước mỗi lần commit hoặc merge.

Luồng workspace frontend/API (server, thành viên, invite, kênh và DM) được mô tả tại [docs/frontend-workflows.md](./docs/frontend-workflows.md).

Chạy kiểm tra toàn bộ workspace trước khi commit:
```bash
# Kiểm tra TypeScript toàn bộ monorepo
pnpm type-check

# Kiểm tra cú pháp và quy chuẩn ESLint
pnpm lint
```

---

## Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Mọi đóng góp xin vui lòng tuân thủ quy trình Git Flow qua Pull Request vào nhánh `dev`.
