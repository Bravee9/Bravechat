# Discord Clone — Architecture Documentation

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                    Next.js 14 (App Router)                       │
│           Landing + Auth + App (SSR/SSG + SPA hybrid)           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│                    Fastify (Node.js)                             │
│         REST API + Socket.io WebSocket Server                    │
│  ┌──────────────┬───────────────┬────────────────────────────┐  │
│  │ Auth Routes  │ Server Routes │ Message Routes + WS Handler│  │
│  └──────────────┴───────────────┴────────────────────────────┘  │
│                     Prisma ORM                                   │
└──────────────┬───────────────────────────────────────────────────┘
               │
       ┌───────┼────────────────┬─────────────────────┐
       ▼       ▼                ▼                     ▼
┌──────────┐ ┌──────────┐ ┌───────────┐  ┌────────────────────────┐
│PostgreSQL│ │  Redis   │ │ BullMQ   │  │   Cloudflare R2        │
│(Primary  │ │(Cache +  │ │(Job Queue│  │   (Object Storage)     │
│ Database)│ │ Pub/Sub) │ │ Workers) │  │   Images/Video/Files   │
└──────────┘ └──────────┘ └───────────┘  └────────────────────────┘
```

## Monorepo Structure (Turborepo)

```
discord/
├── apps/
│   ├── web/                   # Next.js 14 Frontend
│   └── api/                   # Fastify Backend
├── packages/
│   ├── shared/                # Shared TypeScript types
│   └── database/              # Prisma schema & migrations
├── docs/                      # Documentation
├── docker-compose.yml         # Local dev services
├── turbo.json                 # Turborepo pipeline
└── pnpm-workspace.yaml        # pnpm workspace config
```

## Request Flow

### REST API Request
```
Browser → Next.js → Fastify Route → Middleware (Auth/Rate Limit)
→ Service Layer → Prisma → PostgreSQL → Response
```

### Real-time Message Flow
```
Client A → Socket.io → Redis Pub/Sub → Socket.io → Client B, C, D...
                    ↓
              PostgreSQL (persist message)
                    ↓
              BullMQ (media processing jobs)
```

### File Upload Flow
```
Client → Fastify /upload → Validate (type, size)
→ AWS SDK S3 → Cloudflare R2 Bucket
→ Save attachment record to PostgreSQL (r2_key, metadata)
→ Return public URL to client
```

## Security Architecture

### Authentication
- **JWT Access Token**: Short-lived (15m), stored in memory (JS variable)
- **Refresh Token**: Long-lived (7d), stored in HttpOnly cookie
- **Token Rotation**: Refresh token invalidated on use, new pair issued
- **Blacklist**: Redis stores revoked tokens (logout support)

### Authorization
- Role-based permissions trong server (OWNER, ADMIN, MODERATOR, MEMBER)
- Bitfield permissions hệ thống (compatible Discord permission model)
- Channel-level permission overrides cho từng role

### Rate Limiting
- Global: 100 req/min per IP
- Auth endpoints: 5 req/min (brute force protection)
- Message sending: 5 msg/5s per user per channel (spam prevention)
- File upload: 10 uploads/min per user

## Scalability Considerations

### Horizontal Scaling
- **API**: Stateless Fastify instances → Load balancer ready
- **WebSocket**: Redis Pub/Sub cho cross-instance messaging
- **Database**: Read replicas cho heavy read workloads
- **Cache**: Redis cluster mode khi cần

### Performance
- **Message pagination**: Cursor-based (by message ID), not offset-based
- **Database indexes**: channelId + createdAt composite index trên messages
- **Media CDN**: Cloudflare R2 tự động global CDN distribution
- **Redis caching**: Server members, channel info, user presence

## Database Design Principles

1. **UUID vs CUID**: Dùng CUID (Prisma default) — URL-safe, chronological
2. **Soft deletes**: Messages/Users dùng `is_deleted`, không xóa vật lý
3. **Audit fields**: Mọi model đều có `created_at`, `updated_at`
4. **Foreign key cascades**: `onDelete: Cascade` để giữ data consistency
5. **Bitfield permissions**: Lưu permissions như BigInt bitfield (hiệu quả)

## Tech Stack Rationale

| Technology | Lý do chọn |
|-----------|------------|
| Next.js 14 | App Router SSR/SSG + SPA hybrid; tốt cho SEO landing page |
| Fastify | ~2x nhanh hơn Express; native TypeScript; WebSocket plugin |
| PostgreSQL | ACID transactions; JSON support; mature full-text search |
| Redis | In-memory speed; Pub/Sub cho real-time; Session management |
| Cloudflare R2 | S3-compatible API; no egress fees; global CDN |
| Prisma | Type-safe ORM; migration system; schema-first approach |
| Turborepo | Monorepo build caching; parallel task execution |
| pnpm | Fast, disk-efficient; strict dependency isolation |
