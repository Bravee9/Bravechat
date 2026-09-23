# Authentication Flow Documentation

## Tổng quan

Bravechat dùng **JWT + Refresh Token** strategy:
- **Access Token**: JWT ngắn hạn (15 phút), dùng cho mọi API request
- **Refresh Token**: Token dài hạn (7 ngày), lưu trong HttpOnly cookie
- **Token Rotation**: Mỗi lần refresh, cả 2 token đều được cấp mới

## Flow Đăng ký (Register)

```
Client                        API Server                 Database
  │                               │                         │
  │─── POST /api/auth/register ──▶│                         │
  │    { email, username, pass }   │                         │
  │                               │── Validate input ──────▶│
  │                               │── Check email unique ───▶│
  │                               │── Check username unique ─▶│
  │                               │   bcrypt.hash(password) │
  │                               │── INSERT user ──────────▶│
  │                               │◀─ user record ───────────│
  │◀── 201 { user } ─────────────│                         │
  │                               │                         │
```

## Flow Đăng nhập (Login)

```
Client                        API Server          Database      Redis
  │                               │                   │           │
  │─── POST /api/auth/login ─────▶│                   │           │
  │    { email, password }         │                   │           │
  │                               │── Find user ──────▶│           │
  │                               │◀─ user record ─────│           │
  │                               │   bcrypt.compare() │           │
  │                               │── Store refresh ───────────────▶│
  │                               │   token in Redis   │           │
  │                               │── INSERT refresh ──▶│           │
  │                               │   token in DB       │           │
  │◀── 200 { accessToken, user } ─│                   │           │
  │    Set-Cookie: token=...       │                   │           │
  │    (HttpOnly, Secure, SameSite)│                   │           │
```

## Flow Refresh Token

```
Client                        API Server          Database      Redis
  │                               │                   │           │
  │─── POST /api/auth/refresh ───▶│                   │           │
  │    Cookie: token=refreshToken  │                   │           │
  │                               │── Lookup token ────────────────▶│
  │                               │◀─ token data ──────────────────│
  │                               │── Validate (not revoked) ──────▶│
  │                               │── Revoke old token ─────────────▶│
  │                               │── Generate new pair            │
  │                               │── Store new refresh ─────────────▶│
  │◀── 200 { newAccessToken } ────│                   │           │
  │    Set-Cookie: token=newToken  │                   │           │
```

## Flow Đăng xuất (Logout)

```
Client                        API Server                    Redis
  │                               │                            │
  │─── POST /api/auth/logout ────▶│                            │
  │    Authorization: Bearer xxx   │                            │
  │    Cookie: token=refreshToken  │                            │
  │                               │── Add access token ────────▶│
  │                               │   to blacklist (TTL 15m)   │
  │                               │── Revoke refresh token ─────▶│
  │◀── 200 ──────────────────────│                            │
  │    Clear-Cookie: token         │                            │
```

## JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string       // User ID (subject)
  email: string
  username: string
  iat: number       // Issued at
  exp: number       // Expires at
  jti: string       // JWT ID (for blacklist)
}
```

## Cookie Security Settings

```typescript
reply.setCookie('token', refreshToken, {
  httpOnly: true,       // Không accessible từ JavaScript
  secure: true,         // Chỉ gửi qua HTTPS
  sameSite: 'lax',      // CSRF protection
  maxAge: 7 * 24 * 3600,// 7 ngày
  path: '/api/auth',    // Chỉ gửi đến auth endpoints
})
```

## Protected Route Pattern

```typescript
// Middleware authenticate hook
server.decorate('authenticate', async (request, reply) => {
  try {
    // Extract from Authorization header hoặc cookie
    const token = request.headers.authorization?.replace('Bearer ', '')
      ?? request.cookies.accessToken

    if (!token) throw new Error('No token')

    // Verify JWT
    const payload = await request.jwtVerify()

    // Check blacklist in Redis
    const isBlacklisted = await redis.get(`blacklist:${payload.jti}`)
    if (isBlacklisted) throw new Error('Token revoked')

    // Attach user to request
    request.user = payload
  } catch (err) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Bạn cần đăng nhập để thực hiện hành động này.',
    })
  }
})
```

## Password Policy

- Tối thiểu 8 ký tự
- Phải có chữ hoa (A-Z)
- Phải có chữ số (0-9)
- Phải có ký tự đặc biệt (!@#$%^&*)
- Mã hóa bằng **bcrypt**, cost factor 12
- Không lưu plain text bất kỳ đâu

## Rate Limiting cho Auth

| Endpoint | Limit | Window |
|----------|-------|--------|
| /register | 3 req | 1 phút |
| /login | 5 req | 1 phút |
| /refresh | 10 req | 1 phút |
| /logout | 10 req | 1 phút |
