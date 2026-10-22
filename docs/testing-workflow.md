# Quy trình kiểm thử chuẩn

Tài liệu này là checklist chạy Bravechat từ môi trường sạch đến kiểm tra các luồng chính. Chạy theo đúng thứ tự để lỗi được khoanh vùng ở đúng tầng.

## 1. Điều kiện ban đầu

- Node.js 18 hoặc 20, pnpm 8+ và Docker Desktop đang chạy.
- Đã sao chép `.env.example` thành `.env` ở thư mục gốc.
- `JWT_SECRET` là chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
- Các biến R2 (`R2_BUCKET_NAME`, `R2_ENDPOINT_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) trỏ tới bucket thử nghiệm. Không dùng bucket production cho smoke test.
- `NEXT_PUBLIC_API_URL=http://localhost:4000/api` khi chạy web/API trực tiếp.

Không đưa `.env`, access key, secret key hoặc dữ liệu người dùng thật vào commit.

## 2. Cài đặt và kiểm tra mã nguồn

Từ thư mục gốc:

```powershell
pnpm install
pnpm type-check
pnpm --filter @discord-clone/web test
```

`type-check` phải thành công ở `shared`, `api` và `web`. Test giao diện phải chạy xong trước khi khởi động hệ thống tích hợp.

## 3. Khởi động hạ tầng local

```powershell
docker compose up -d postgres redis livekit
docker compose ps
```

Chỉ tiếp tục khi PostgreSQL và Redis có trạng thái `healthy`.

Khởi tạo Prisma theo schema trong monorepo:

```powershell
pnpm exec prisma generate --schema packages/database/prisma/schema.prisma
pnpm exec prisma db push --schema packages/database/prisma/schema.prisma
```

`db push` phù hợp cho máy local thử nghiệm. Khi có migration chính thức, dùng `prisma migrate deploy` thay cho `db push`; không reset volume trong lúc cần giữ dữ liệu.

## 4. Kiểm tra Cloudflare R2 trước khi chạy web

```powershell
pnpm --filter @discord-clone/api r2:test
```

Smoke test phải đạt các bước: `HeadBucket`, upload object, `HeadObject`, tải lại bằng presigned GET, presigned PUT và dọn object test. Nếu chỉ bước CORS lỗi `Access Denied`, token đang thiếu quyền quản trị bucket. Có thể tiếp tục test chat vì upload hiện tại đi qua API đã xác thực, nhưng muốn trình duyệt PUT thẳng lên R2 thì phải cấu hình CORS trong Cloudflare Dashboard hoặc dùng token có quyền bucket CORS.

Cấu hình CORS (chỉ khi token có quyền Admin Read & Write):

```powershell
pnpm --filter @discord-clone/api r2:cors
```

## 5. Chạy API và web ở hai terminal

Terminal API:

```powershell
pnpm --filter @discord-clone/api dev
```

Terminal web:

```powershell
pnpm --filter @discord-clone/web dev
```

Kiểm tra nhanh:

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/health/storage
```

Mở `http://localhost:3000`. Nếu chạy bằng Docker Compose đầy đủ, truy cập qua `http://localhost` và dùng đúng URL API/WS được truyền vào lúc build web.

## 6. Smoke test chức năng người dùng

Thực hiện bằng hai tài khoản trình duyệt hoặc một cửa sổ ẩn danh:

1. Đăng ký tài khoản A, đăng xuất, đăng nhập lại.
2. Tải lại trang sau khi access token hết hạn giả lập; API phải tự refresh phiên. Đăng xuất rồi gọi lại API phải bị yêu cầu đăng nhập.
3. Mở cài đặt hồ sơ, đổi tên hiển thị, tên người dùng, giới thiệu, avatar và banner. Xác nhận email và ID không có ô chỉnh sửa.
4. Tài khoản A tạo server. Kiểm tra server có category và các kênh `general`, `voice`, `video`.
5. Tài khoản B tham gia server theo luồng invite hiện có (hoặc dùng tài khoản đã là member), mở cùng kênh `general`.
6. Gửi tin nhắn ở cả hai cửa sổ. Xác nhận tin nhắn xuất hiện theo thời gian thực và vẫn còn sau khi refresh.
7. Đính kèm một ảnh nhỏ trong kênh. Xác nhận ảnh upload thành công, hiển thị được và object tạm được chuyển khỏi vùng `pending/`.
8. Ở mục tin nhắn trực tiếp, nhấn `+`, tìm username của tài khoản còn lại, gửi DM và refresh. Tin nhắn phải còn trong cuộc trò chuyện.
9. Mở URL không tồn tại, xác nhận trang 404 tùy chỉnh hiển thị đúng.
10. Mở `/terms` và `/privacy`: mặc định chỉ có tiếng Việt; chọn `English` thì toàn bộ phần nội dung, điều hướng và chân trang chuyển sang tiếng Anh.

## 7. Kiểm tra dữ liệu sau smoke test

Mở Prisma Studio nếu cần kiểm tra bằng giao diện:

```powershell
pnpm exec prisma studio --schema packages/database/prisma/schema.prisma
```

Kiểm tra các bảng `users`, `servers`, `server_members`, `channels`, `messages`, `direct_messages`, `attachments` và `refresh_tokens`. Không thấy password thô; token refresh trong database phải là hash; message phải tham chiếu đúng channel/author.

## 8. Dọn môi trường

Tắt tiến trình dev bằng `Ctrl+C` rồi:

```powershell
docker compose down
```

Không dùng `docker compose down -v` trừ khi cố ý xóa toàn bộ database và Redis local. Smoke test R2 tự dọn object kiểm tra; nếu bị ngắt giữa chừng, xóa thủ công các object dưới prefix `healthcheck/` của bucket thử nghiệm.

## 9. Tiêu chí đạt trước khi commit

- `pnpm type-check` đạt.
- `pnpm --filter @discord-clone/web test` đạt.
- `/health` và `/health/storage` trả trạng thái thành công.
- R2 smoke test đạt hoặc đã ghi rõ lỗi CORS do quyền token.
- Các luồng đăng nhập, hồ sơ, server, message, attachment, DM và điều khoản đa ngôn ngữ đã chạy qua checklist.
- `git diff --check` không báo lỗi; commit chỉ chứa một nhóm thay đổi có thông điệp rõ ràng.
