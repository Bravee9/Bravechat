# API Reference

Base URL: `http://localhost:4000/api`

## Authentication

Hầu hết các endpoints yêu cầu JWT access token:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Tạo tài khoản mới.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "nguyen_minh",
  "displayName": "Nguyễn Minh",
  "password": "SecurePass123!"
}
```

**Response 201:**
```json
{
  "statusCode": 201,
  "message": "Tài khoản đã được tạo thành công.",
  "data": {
    "id": "cuid...",
    "email": "user@example.com",
    "username": "nguyen_minh",
    "displayName": "Nguyễn Minh",
    "createdAt": "2026-09-23T00:00:00.000Z"
  }
}
```

**Errors:**
- `400` — Validation error (email invalid, username taken, etc.)
- `409` — Email hoặc username đã tồn tại
- `429` — Too many requests (5 req/min)

---

### POST /auth/login
Đăng nhập.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "statusCode": 200,
  "message": "Đăng nhập thành công.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid...",
      "username": "nguyen_minh",
      "displayName": "Nguyễn Minh",
      "avatarUrl": "https://pub-xxx.r2.dev/avatars/..."
    }
  }
}
```

Sets HttpOnly cookie `token` with refresh token.

---

### POST /auth/logout
Đăng xuất, thu hồi token.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{ "statusCode": 200, "message": "Đã đăng xuất." }
```

---

### POST /auth/refresh
Lấy access token mới từ refresh token trong cookie.

**Response 200:**
```json
{
  "statusCode": 200,
  "data": { "accessToken": "eyJ..." }
}
```

---

### GET /auth/me
Lấy thông tin user đang đăng nhập.

**Response 200:**
```json
{
  "statusCode": 200,
  "data": {
    "user": { "id": "...", "username": "...", "status": "ONLINE" }
  }
}
```

---

## User Endpoints

### GET /users/:userId
Xem profile công khai của một user.

### PATCH /users/@me
Cập nhật profile của mình.

**Request Body** (tất cả optional):
```json
{
  "displayName": "Tên mới",
  "bio": "Giới thiệu bản thân",
  "customStatus": "Đang code..."
}
```

### PATCH /users/@me/status
Thay đổi trạng thái.

```json
{ "status": "ONLINE" | "IDLE" | "DO_NOT_DISTURB" | "INVISIBLE" }
```

### POST /users/@me/avatar
Upload avatar (multipart/form-data).

---

## Server Endpoints

### POST /servers
Tạo server mới.

```json
{
  "name": "Tên server",
  "description": "Mô tả (optional)"
}
```

### GET /servers/:serverId
Lấy thông tin server (channels, members summary).

### PATCH /servers/:serverId
Cập nhật server (owner only).

### GET /servers/:serverId/members
Danh sách thành viên với pagination.

Query: `?limit=50&after=<cursor>`

### POST /invites/:code
Tham gia server bằng mã mời.

---

## Channel Endpoints

### GET /channels/:channelId/messages
Lấy lịch sử tin nhắn với cursor pagination.

Query params:
- `limit`: 50 (max 100)
- `before`: Message ID để lấy các tin nhắn cũ hơn
- `after`: Message ID để lấy các tin nhắn mới hơn
- `around`: Message ID để lấy các tin nhắn xung quanh

**Response 200:**
```json
{
  "statusCode": 200,
  "data": {
    "messages": [...],
    "hasMore": true,
    "nextCursor": "cuid..."
  }
}
```

### POST /channels/:channelId/typing
Phát sự kiện "đang gõ..." (WebSocket broadcast).

---

## Upload Endpoints

### POST /uploads/presign
Lấy presigned URL để upload file trực tiếp lên R2.

```json
{
  "filename": "image.png",
  "contentType": "image/png",
  "context": "avatar" | "attachment"
}
```

**Response 200:**
```json
{
  "statusCode": 200,
  "data": {
    "attachmentId": "cuid...",
    "r2Key": "attachments/...",
    "presignedUrl": "https://...r2.cloudflarestorage.com/...",
    "expiresAt": "2026-09-23T01:00:00Z"
  }
}
```

### POST /uploads/confirm
Confirm file đã upload xong.

```json
{ "attachmentId": "cuid..." }
```

---

## WebSocket Events

### Connection
```
ws://localhost:4000/ws?token=<access_token>
```

### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join_channel` | `{ channelId }` | Subscribe to channel |
| `leave_channel` | `{ channelId }` | Unsubscribe |
| `send_message` | `{ channelId, content, nonce }` | Gửi tin nhắn |
| `typing_start` | `{ channelId }` | Đang gõ... |
| `typing_stop` | `{ channelId }` | Ngừng gõ |

### Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `message_create` | Message object | Tin nhắn mới |
| `message_update` | `{ id, content, editedAt }` | Tin nhắn đã sửa |
| `message_delete` | `{ id, channelId }` | Tin nhắn đã xóa |
| `typing_start` | `{ userId, channelId }` | User đang gõ |
| `presence_update` | `{ userId, status }` | Trạng thái user thay đổi |
| `member_join` | Member object | Member mới vào server |
| `member_leave` | `{ userId, serverId }` | Member rời server |

---

## Error Response Format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Mô tả lỗi thân thiện",
  "details": {
    "field": ["Chi tiết lỗi cụ thể"]
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation) |
| 401 | Unauthorized |
| 403 | Forbidden (không có quyền) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
