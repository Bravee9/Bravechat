# ADR 001: Sử dụng Cloudflare R2 cho lưu trữ File Đa Phương Tiện (Multimedia)

**Status:** Accepted  
**Context:**  
Nền tảng Bravechat yêu cầu tính năng chia sẻ tệp đa phương tiện lớn (video, âm thanh, hình ảnh) trong các kênh trò chuyện thời gian thực. Do tính chất các file media có thể rất nặng và số lượng nhiều, việc lưu trữ nhị phân (BLOB) trực tiếp trong PostgreSQL sẽ gây phình to database, chậm truy vấn và khó khăn trong sao lưu/phục hồi. Ngoài ra, việc băng thông tải xuống media thường xuyên cũng là một yếu tố chi phí cần xem xét (đặc biệt với project có sinh viên quản lý và có chi phí hạn hẹp).

**Decision:**  
Chúng ta quyết định sử dụng **Cloudflare R2 Object Storage** thay vì PostgreSQL BLOB hoặc AWS S3 truyền thống.
- Các API phía backend (Fastify) sẽ không nhận file trực tiếp. Thay vào đó, API sinh ra một `Presigned URL` bằng thư viện `@aws-sdk/s3-request-presigner`.
- Frontend (Next.js) nhận `Presigned URL` này và tải trực tiếp file từ trình duyệt của người dùng lên Cloudflare R2 (giảm tải hoàn toàn băng thông tải lên cho server backend).
- Sau khi file lên R2 thành công, Frontend mới gửi một message đính kèm URL công khai của file đó vào Database.

**Alternatives considered:**
- **PostgreSQL (BYTEA/BLOB):** Bị loại bỏ vì làm giảm hiệu suất database đáng kể, chi phí lưu trữ ổ đĩa block storage của DB đắt đỏ, và làm quá trình backup chậm.
- **Lưu trên ổ đĩa máy chủ (Local Storage):** Bị loại bỏ vì kiến trúc sẽ chuyển sang Microservices / Docker. Local storage sẽ không đồng bộ giữa các node/container và khó scale-out.
- **AWS S3:** Bị loại bỏ do Cloudflare R2 tương thích 100% với S3 API nhưng lại miễn phí 100% băng thông đầu ra (egress traffic), cực kỳ phù hợp với ứng dụng Chat nơi 1 file tải lên có thể được hàng trăm user tải xuống.

**Consequences:**
- *Trở nên dễ dàng hơn:* Giảm chi phí băng thông egress xuống $0, Backend không bao giờ bị thắt cổ chai ở RAM hay Network khi user upload video nặng (vì user upload thẳng lên R2).
- *Trở nên khó hơn:* Phải quản lý thêm vòng đời file rác (orphan files) trên R2 (file upload lên thành công nhưng user tắt trình duyệt trước khi báo lại cho Database). Cần CORS config khắt khe trên R2.

**Revisit trigger:**  
- Xem xét lại nếu Cloudflare R2 thay đổi chính sách thu phí băng thông đầu ra.
- Xem xét lại nếu có nhu cầu phân tích nội dung/xử lý video trực tiếp (transcoding) tại backend trước khi lưu.
