# Luồng frontend chính

Tài liệu này nối hành vi trên giao diện với endpoint và nơi dữ liệu được lưu. Các API dưới đây đều nằm dưới `/api` và yêu cầu access token trừ khi ghi chú khác.

## Khởi động workspace

1. `WorkspaceBootstrap` tải user hiện tại, server người dùng tham gia và các cuộc trò chuyện vào `workspaceStore`.
2. `ServerRail`, `DmSidebar` và `UserProfileBar` đọc store; component không tự tạo bản ghi.
3. Khi tạo/tham gia/rời server, client đợi API thành công rồi mới tải lại danh sách server. Khi đổi tên server hoặc tạo kênh, client làm mới cache server detail trước khi hiển thị kết quả.
4. `WorkspaceRealtime` mở socket theo server membership và cập nhật unread state theo message event. Tin nhắn server được ghi vào Prisma trước khi phát socket event.

## Server và thành viên

| Thao tác | Giao diện → API | Kiểm tra quyền / lưu trữ |
| --- | --- | --- |
| Tạo server | Nút `+` → `POST /servers` | Trong một transaction tạo server, membership owner, danh mục đầu tiên và kênh mặc định. |
| Xem thành viên | `MemberList` → `GET /servers/:serverId/members` | Chỉ thành viên chưa bị cấm mới đọc được; danh tính lấy từ `server_members` và `users`. Tối đa 500 thành viên cho mỗi lần tải ở phiên bản hiện tại. |
| Đổi tên | Menu → `PATCH /servers/:serverId` | Chỉ owner; cập nhật `servers.name`, giữ ID bất biến. |
| Tạo kênh | Menu/dấu `+` danh mục → `POST /servers/:serverId/channels` | Chỉ owner; kênh được gắn vào danh mục đầu tiên nếu không truyền category. |
| Tạo lời mời | Menu → `POST /servers/:serverId/invites` | Chỉ thành viên đang tham gia mới tạo được; mã ngẫu nhiên hết hạn sau 7 ngày. |
| Dùng lời mời | `/invite/:code` → `POST /invites/:code` | Kiểm tra tồn tại, hạn dùng, lượt tối đa, trạng thái cấm; tăng lượt và thêm membership trong transaction. |
| Rời server | Menu → `DELETE /servers/:serverId/members/@me` | Owner không được rời trước khi chuyển quyền sở hữu. Sau khi API thành công, client bỏ server khỏi store và quay về DM. |

Member panel làm mới mỗi 30 giây để phản ánh trạng thái tài khoản mới. `users.status` hiện là trạng thái được lưu, chưa có heartbeat/presence event realtime; không dùng nhãn này để kết luận thiết bị còn kết nối.

## Tin nhắn trực tiếp

1. Nút `+` mở form tìm theo username.
2. Client gọi `GET /users/search?username=...`, sau đó chỉ mở kết quả trùng chính xác (không tự chọn một kết quả gần đúng).
3. Route DM dùng ID user cố định; email và entity ID không được cập nhật qua form hồ sơ.
4. Cuộc trò chuyện xuất hiện trong danh sách sau khi có ít nhất một direct message được lưu. Schema hiện chưa có bản ghi conversation rỗng.

## Lỗi và phiên đăng nhập

- Các thao tác form hiển thị lỗi cạnh form; không dùng `window.alert` hoặc `window.prompt`.
- `http.ts` gửi cookie cùng request, thử refresh một lần sau `401`, rồi trả `ApiError` để giao diện hiển thị lỗi.
- Invite page cần phiên đăng nhập; nếu API trả `401`, người dùng hiện thấy lỗi và có thể đăng nhập rồi mở lại link.

## Kiểm tra thủ công

Checklist end-to-end tổng thể nằm trong [testing-workflow.md](./testing-workflow.md). Với luồng ở tài liệu này, kiểm tra thêm:

1. Tạo server bằng tài khoản A; kiểm tra `servers`, `server_members`, `channel_categories`, `channels`.
2. Đổi tên và tạo kênh với owner; xác nhận rail/header/sidebar cập nhật sau API.
3. Tạo invite, mở ở cửa sổ/tài khoản B, tham gia; xác nhận `server_members` tăng một hàng và server xuất hiện ở rail B.
4. Thử dùng invite hết hạn/hết lượt và xác nhận lỗi hiển thị trong trang.
5. Rời server bằng B; xác nhận membership bị xóa và B mất quyền đọc channel/member API. Owner phải nhận lỗi khi cố rời.
6. Mở member panel bằng B; xác nhận danh sách lấy từ server, không hiển thị các fixture cũ.
7. Tìm DM bằng username đúng và gần đúng; chỉ username khớp chính xác được mở.

## Việc cần dịch vụ ngoài để hoàn tất

Quên mật khẩu hiện chưa thể chạy end-to-end: API chưa có model/token reset và môi trường chưa khai báo nhà cung cấp email. Không được hiển thị trạng thái “email đã gửi” giả. Cần chọn/cấu hình dịch vụ gửi email trước khi bật luồng reset an toàn.
