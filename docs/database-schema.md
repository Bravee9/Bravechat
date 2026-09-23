# Database Schema Documentation

## ERD Overview

```
users ──< server_members >── servers ──< channels ──< messages
                                    ──< roles ─────< member_roles
                                    ──< channel_categories
                                    ──< server_invites

messages ──< attachments
         ──< message_reactions
         ──< message_embeds
         ──< messages (self-ref: replies)

users ──< direct_messages
     ──< friendships
     ──< refresh_tokens
```

## Models

### users
| Column | Type | Description |
|--------|------|-------------|
| id | CUID | Primary key |
| username | VARCHAR(32) | Unique, lowercase, alphanumeric |
| discriminator | VARCHAR(4) | 4-digit number (legacy, mặc định "0000") |
| email | VARCHAR(254) | Unique |
| password_hash | TEXT | bcrypt hash |
| avatar_key | TEXT? | R2 object key |
| banner_key | TEXT? | R2 object key |
| display_name | VARCHAR(32)? | Tên hiển thị (có thể khác username) |
| bio | VARCHAR(190)? | Giới thiệu bản thân |
| status | ENUM | ONLINE/IDLE/DO_NOT_DISTURB/INVISIBLE/OFFLINE |
| custom_status | VARCHAR(128)? | Status tùy chỉnh |
| is_email_verified | BOOLEAN | Xác thực email |
| is_banned | BOOLEAN | Tài khoản bị ban |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-updated |
| last_seen_at | TIMESTAMPTZ? | Lần cuối hoạt động |

### servers
| Column | Type | Description |
|--------|------|-------------|
| id | CUID | Primary key |
| name | VARCHAR(100) | Tên server |
| description | VARCHAR(500)? | Mô tả |
| icon_key | TEXT? | R2 object key |
| banner_key | TEXT? | R2 object key |
| is_public | BOOLEAN | Server có thể tìm kiếm không |
| verification_level | ENUM | NONE/LOW/MEDIUM/HIGH/VERY_HIGH |
| owner_id | CUID | FK → users.id |
| created_at | TIMESTAMPTZ | |

### channels
| Column | Type | Description |
|--------|------|-------------|
| id | CUID | Primary key |
| server_id | CUID | FK → servers.id |
| category_id | CUID? | FK → channel_categories.id |
| name | VARCHAR(100) | Tên kênh |
| type | ENUM | TEXT/VOICE/VIDEO/ANNOUNCEMENT/STAGE/FORUM |
| topic | VARCHAR(1024)? | Chủ đề kênh |
| position | INT | Thứ tự hiển thị |
| is_nsfw | BOOLEAN | |
| slow_mode_delay | INT | Giây giữa các tin nhắn |
| bitrate | INT? | Cho VOICE channels (bps) |
| user_limit | INT? | Giới hạn người trong VOICE |
| last_message_id | TEXT? | ID tin nhắn cuối (cache) |

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | CUID | Primary key |
| channel_id | CUID | FK → channels.id |
| author_id | CUID | FK → users.id |
| content | TEXT? | Nội dung (nullable nếu chỉ có attachment) |
| type | ENUM | DEFAULT/REPLY/JOIN/LEAVE/BOOST/SYSTEM |
| is_pinned | BOOLEAN | |
| is_edited | BOOLEAN | |
| is_deleted | BOOLEAN | Soft delete |
| reply_to_id | CUID? | Self-ref FK |
| nonce | TEXT? | Client dedup ID |
| created_at | TIMESTAMPTZ | Indexed cùng channel_id |
| edited_at | TIMESTAMPTZ? | |

### attachments
| Column | Type | Description |
|--------|------|-------------|
| id | CUID | Primary key |
| message_id | CUID | FK → messages.id |
| filename | VARCHAR(255) | Tên file gốc |
| content_type | VARCHAR(127) | MIME type |
| size | INT | Bytes |
| r2_key | TEXT | **Cloudflare R2 object key** |
| width | INT? | Cho image/video |
| height | INT? | Cho image/video |
| duration | FLOAT? | Cho audio/video (giây) |
| type | ENUM | IMAGE/VIDEO/AUDIO/FILE/GIF |

### direct_messages
| Column | Type | Description |
|--------|------|-------------|
| id | CUID | Primary key |
| sender_id | CUID | FK → users.id |
| receiver_id | CUID | FK → users.id |
| content | TEXT? | Nội dung |
| is_read | BOOLEAN | Đã đọc chưa |
| is_deleted | BOOLEAN | Soft delete |
| r2_key | TEXT? | File attachment |
| created_at | TIMESTAMPTZ | Indexed cùng sender_id + receiver_id |

## Indexes

```sql
-- Quan trọng nhất: tin nhắn trong channel (cursor pagination)
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at);

-- DM history
CREATE INDEX idx_dm_sender_receiver_created ON direct_messages(sender_id, receiver_id, created_at);

-- Refresh token lookup
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

## Migrations

Dùng Prisma Migrate:
```bash
# Tạo migration
cd packages/database
pnpm prisma migrate dev --name init

# Apply migration lên production
pnpm prisma migrate deploy

# Reset database (DEV ONLY)
pnpm prisma migrate reset

# Open Prisma Studio (GUI)
pnpm prisma studio
```

## Seeding

```bash
# Chạy seed data
pnpm prisma db seed
```

Seed file: `packages/database/prisma/seed.ts`
- Tạo 5 test users
- 2 test servers với channels đầy đủ
- 50 test messages
