-- ============================================================================
-- 01_queries_basic_and_advanced.sql
-- Bộ truy vấn SQL từ cơ bản đến nâng cao cho Đồ án môn Cơ sở dữ liệu (Bravechat)
-- ============================================================================

-- 1. SELECT cơ bản + WHERE + ORDER BY + LIMIT
-- Lấy danh sách 10 người dùng đang trực tuyến mới nhất
SELECT id, username, display_name, status, last_seen_at
FROM users
WHERE status = 'ONLINE' AND is_banned = false
ORDER BY last_seen_at DESC NULLS LAST
LIMIT 10;

-- 2. Tìm kiếm gần đúng (ILIKE) trên tin nhắn chưa bị xóa
SELECT m.id, m.content, m.created_at, u.username AS author
FROM messages m
INNER JOIN users u ON u.id = m.author_id
WHERE m.is_deleted = false
  AND m.content ILIKE '%hello%'
ORDER BY m.created_at DESC
LIMIT 20;

-- 3. INNER JOIN nhiều bảng: Liệt kê danh sách máy chủ và vai trò của từng thành viên
SELECT s.id AS server_id,
       s.name AS server_name,
       u.username,
       sm.is_owner,
       COALESCE(r.name, 'Member') AS role_name
FROM server_members sm
INNER JOIN servers s ON s.id = sm.server_id
INNER JOIN users u ON u.id = sm.user_id
LEFT JOIN member_roles mr ON mr.member_id = sm.id
LEFT JOIN roles r ON r.id = mr.role_id
WHERE sm.is_banned = false
ORDER BY s.name ASC, sm.is_owner DESC, u.username ASC;

-- 4. LEFT JOIN + GROUP BY + COUNT: Thống kê số lượng tin nhắn của từng kênh trong mọi máy chủ
SELECT s.name AS server_name,
       c.name AS channel_name,
       c.type AS channel_type,
       c.is_private,
       COUNT(m.id) AS total_messages,
       MAX(m.created_at) AS last_message_at
FROM channels c
INNER JOIN servers s ON s.id = c.server_id
LEFT JOIN messages m ON m.channel_id = c.id AND m.is_deleted = false
GROUP BY s.id, s.name, c.id, c.name, c.type, c.is_private
ORDER BY total_messages DESC;

-- 5. GROUP BY + HAVING + SUM: Thống kê dung lượng tệp đính kèm theo loại (chỉ lấy loại có > 0 byte)
SELECT a.type AS attachment_type,
       COUNT(a.id) AS total_files,
       SUM(a.size) AS total_bytes,
       ROUND(AVG(a.size), 2) AS avg_bytes
FROM attachments a
INNER JOIN messages m ON m.id = a.message_id
WHERE m.is_deleted = false
GROUP BY a.type
HAVING SUM(a.size) > 0
ORDER BY total_bytes DESC;

-- 6. Subquery: Tìm các máy chủ có số lượng thành viên lớn hơn mức trung bình của hệ thống
SELECT s.id, s.name, COUNT(sm.id) AS member_count
FROM servers s
INNER JOIN server_members sm ON sm.server_id = s.id AND sm.is_banned = false
GROUP BY s.id, s.name
HAVING COUNT(sm.id) > (
  SELECT AVG(cnt)
  FROM (
    SELECT COUNT(*) AS cnt
    FROM server_members
    WHERE is_banned = false
    GROUP BY server_id
  ) sub
);

-- 7. CTE (WITH) + Window Function RANK(): Xếp hạng thành viên nhắn tin tích cực nhất trong mỗi máy chủ
WITH member_message_counts AS (
  SELECT c.server_id,
         u.id AS user_id,
         u.username,
         COUNT(m.id) AS msg_count
  FROM messages m
  INNER JOIN channels c ON c.id = m.channel_id
  INNER JOIN users u ON u.id = m.author_id
  WHERE m.is_deleted = false
  GROUP BY c.server_id, u.id, u.username
)
SELECT s.name AS server_name,
       mmc.username,
       mmc.msg_count,
       RANK() OVER (PARTITION BY mmc.server_id ORDER BY mmc.msg_count DESC) AS rank_in_server
FROM member_message_counts mmc
INNER JOIN servers s ON s.id = mmc.server_id
ORDER BY s.name, rank_in_server;

-- 8. Kiểm tra quyền truy cập Kênh riêng tư (Private Channel Access Control)
SELECT c.id, c.name, c.is_private
FROM channels c
INNER JOIN server_members sm ON sm.server_id = c.server_id AND sm.is_banned = false
WHERE sm.user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
  AND (
    c.is_private = false
    OR sm.is_owner = true
    OR EXISTS (
      SELECT 1
      FROM channel_role_permissions crp
      INNER JOIN member_roles mr ON mr.role_id = crp.role_id
      WHERE crp.channel_id = c.id
        AND mr.member_id = sm.id
        AND crp.can_view = true
    )
  );

-- 9. Thống kê số tin nhắn chưa đọc (Unread Count) của từng người dùng theo mốc last_read_at
SELECT u.username,
       c.name AS channel_name,
       COUNT(m.id) AS unread_count
FROM server_members sm
INNER JOIN users u ON u.id = sm.user_id
INNER JOIN channels c ON c.server_id = sm.server_id
LEFT JOIN channel_read_states crs ON crs.user_id = sm.user_id AND crs.channel_id = c.id
LEFT JOIN messages m ON m.channel_id = c.id
  AND m.is_deleted = false
  AND m.author_id <> sm.user_id
  AND m.created_at > COALESCE(crs.last_read_at, sm.joined_at)
GROUP BY u.username, c.name
ORDER BY unread_count DESC;

-- 10. UPSERT (INSERT ... ON CONFLICT DO UPDATE) trạng thái đọc tin nhắn
-- (Ví dụ minh họa cấu trúc giao dịch chuẩn; rollback để không làm sai dữ liệu mẫu)
BEGIN;
  INSERT INTO channel_read_states (user_id, channel_id, last_read_at)
  SELECT sm.user_id, c.id, NOW()
  FROM server_members sm
  INNER JOIN channels c ON c.server_id = sm.server_id
  LIMIT 1
  ON CONFLICT (user_id, channel_id)
  DO UPDATE SET last_read_at = GREATEST(channel_read_states.last_read_at, EXCLUDED.last_read_at);
ROLLBACK;
