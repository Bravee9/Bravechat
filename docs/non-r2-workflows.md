# Các luồng đã nối frontend và backend (không dùng R2)

## Sử dụng

- `/channels/@me`: trang Bạn bè. Gửi lời mời theo username; ở Đang chờ có chấp nhận/từ chối hoặc hủy lời mời đã gửi. Danh sách bạn có nút Nhắn tin, Hủy kết bạn, Chặn. Mục Đã chặn có Bỏ chặn.
- Nhấn tên tác giả hoặc thành viên để xem hồ sơ public, mở DM, gửi lời mời hoặc chặn. Email, mật khẩu và dữ liệu phiên không nằm trong hồ sơ public.
- Tin nhắn kênh và DM: trả lời bằng nút ↩, chọn một trong sáu emoji hoặc nhấn reaction đã chọn để bỏ. Chủ tin nhắn có thể sửa/xóa; backend kiểm tra tác giả bằng ID. Owner server có thể xóa tin nhắn của thành viên qua API.
- Tin nhắn chỉ được hiển thị như đã gửi sau xác nhận DB. Khi lỗi, nội dung giữ nguyên; retry dùng lại nonce để không tạo tin trùng. Reply được kiểm tra thuộc đúng kênh/cuộc trò chuyện. Tin gốc bị xóa hiển thị placeholder trong phần trích dẫn.
- DM dùng WebSocket theo danh tính đã xác thực. Hai chiều của một cuộc trò chuyện chỉ tạo một mục trong sidebar; unread xét mọi tin nhận chưa đọc, thay vì chỉ xét tin cuối. Lịch sử có cursor dựa trên createdAt + ID, kể cả khi nhiều tin cùng timestamp.
- Chặn ngăn gửi DM và gửi lời mời kết bạn ở cả hai chiều; chỉ người tạo block được bỏ chặn. Lịch sử cũ vẫn có thể đọc. Không xóa dữ liệu cuộc trò chuyện khi chặn.
- Đổi tên/trạng thái hồ sơ cập nhật từ DB; quick mute/deafen dùng cùng trạng thái với phòng LiveKit. Voice/video vẫn cần máy chủ LiveKit khả dụng và quyền micro/camera của trình duyệt.
- Nút tạo kênh ở từng category giữ đúng category đã chọn.

## Khôi phục mật khẩu

Luồng `/forgot-password` → thư khôi phục → `/reset-password?token=...` đã hoạt động. Token ngẫu nhiên, hash SHA-256 trong DB, hết hạn sau 15 phút và chỉ dùng một lần. Reset thành công thu hồi mọi refresh session và đóng các WebSocket của tài khoản.

Ở môi trường local, khi chưa khai báo Resend, thư được ghi tại **`.local/mail/*.json`** (đã được bỏ qua trong Git). Mở file có trường `to` là email đã yêu cầu, rồi mở trường `url` trong trình duyệt. Đây là hộp thư phát triển, không phải email được gửi ra Internet. Không chia sẻ file này vì chứa liên kết khôi phục tài khoản.

Muốn gửi email thật, cấu hình trên máy chủ:

```dotenv
RESEND_API_KEY=<Resend API key>
RESET_EMAIL_FROM=Bravechat <account@your-verified-domain.example>
```

Địa chỉ gửi phải thuộc domain được xác minh trong Resend. Khởi động lại API sau khi đổi môi trường. Production không có cấu hình gửi email trả 503; không báo đã gửi giả. Luồng gửi sử dụng [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email).

## Kiểm thử

```powershell
pnpm dev
# Trong terminal khác:
pnpm type-check
pnpm --filter @discord-clone/web test
pnpm test:integration
```

Integration chạy với DB/API local và mailbox phát triển, tạo ba tài khoản tạm cùng một server, kiểm tra cả trường hợp thành công và bị từ chối, rồi dọn dữ liệu của test. Không chạy integration này với email provider thật hoặc NODE_ENV=production.

Các kiểm tra bao gồm gửi lại đồng thời không trùng, nonce bị tái sử dụng sai nội dung, reply chéo kênh, sửa/xóa không đúng tác giả, reaction trùng, DM không phát cho bên thứ ba, pagination cùng timestamp, unread khi tin cuối là tin gửi đi, chặn/bỏ chặn, giả mạo xử lý lời mời, lời mời đối ứng đồng thời, logout/reset đóng socket, reset token bị dùng lại hoặc dùng đồng thời.

## Phạm vi tạm để lại

Upload tệp, avatar, banner, icon server và việc kiểm thử lưu trữ Cloudflare R2 chưa nằm trong đợt hoàn thiện này. Code R2 hiện có được giữ lại.

## Trạng thái chưa đọc của kênh

Mốc đã đọc được lưu trong `channel_read_states` theo user/kênh. `POST /channels/:channelId/read` chỉ chấp nhận thành viên của server, cập nhật mốc tăng dần và phát `channel_read` về các phiên của cùng tài khoản. Server list và channel detail tính lại unread/mention từ DB; không đếm tin của chính người dùng hoặc tin đã xóa. Mention hiện nhận diện bằng @username hoặc @displayName trong nội dung.

Frontend chỉ xác nhận đọc khi tab đang hiển thị, sau khi tải lịch sử hoặc nhận tin mới; các xác nhận liên tiếp được gộp trong 500ms. Khi tab ẩn, tin vẫn được ghi nhận là chưa đọc. DM cũng không đánh dấu đã đọc khi tải nền (`?read=false`).
