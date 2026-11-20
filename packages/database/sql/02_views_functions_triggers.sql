-- ============================================================================
-- 02_views_functions_triggers.sql
-- View thống kê, Stored Function và Trigger toàn vẹn dữ liệu trên PostgreSQL
-- ============================================================================

-- 1. VIEW: Thống kê hoạt động của từng kênh trong các máy chủ
CREATE OR REPLACE VIEW v_channel_message_stats AS
SELECT s.id AS server_id,
       s.name AS server_name,
       c.id AS channel_id,
       c.name AS channel_name,
       c.type AS channel_type,
       c.is_private,
       COUNT(DISTINCT m.id)::int AS message_count,
       COUNT(DISTINCT a.id)::int AS attachment_count,
       COALESCE(SUM(a.size), 0)::bigint AS total_attachment_bytes,
       MAX(m.created_at) AS last_message_at
FROM channels c
INNER JOIN servers s ON s.id = c.server_id
LEFT JOIN messages m ON m.channel_id = c.id AND m.is_deleted = false
LEFT JOIN attachments a ON a.message_id = m.id
GROUP BY s.id, s.name, c.id, c.name, c.type, c.is_private;

-- 2. VIEW: Tổng hợp thành viên và danh sách vai trò theo từng máy chủ
CREATE OR REPLACE VIEW v_server_member_roles AS
SELECT s.id AS server_id,
       s.name AS server_name,
       u.id AS user_id,
       u.username,
       u.display_name,
       u.status,
       sm.is_owner,
       sm.is_banned,
       sm.joined_at,
       COALESCE(STRING_AGG(r.name, ', ' ORDER BY r.position DESC), 'Member') AS role_names
FROM server_members sm
INNER JOIN servers s ON s.id = sm.server_id
INNER JOIN users u ON u.id = sm.user_id
LEFT JOIN member_roles mr ON mr.member_id = sm.id
LEFT JOIN roles r ON r.id = mr.role_id
GROUP BY s.id, s.name, u.id, u.username, u.display_name, u.status, sm.is_owner, sm.is_banned, sm.joined_at;

-- 3. FUNCTION + TRIGGER: Tự động cập nhật channels.last_message_id khi có tin nhắn mới
CREATE OR REPLACE FUNCTION fn_update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = false THEN
    UPDATE channels
    SET last_message_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.channel_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_update_last_message ON messages;
CREATE TRIGGER trg_messages_update_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION fn_update_channel_last_message();

-- 4. FUNCTION + TRIGGER: Bảo vệ toàn vẹn — không cho phép xóa chủ sở hữu (is_owner = true) khi server vẫn tồn tại
CREATE OR REPLACE FUNCTION fn_prevent_delete_server_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_owner = true AND EXISTS (SELECT 1 FROM servers WHERE id = OLD.server_id) THEN
    RAISE EXCEPTION 'Không thể xóa thành viên là chủ sở hữu duy nhất của máy chủ %', OLD.server_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_delete_owner ON server_members;
CREATE TRIGGER trg_prevent_delete_owner
BEFORE DELETE ON server_members
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_delete_server_owner();

-- 5. Kiểm tra nhanh các VIEW vừa tạo
SELECT * FROM v_channel_message_stats LIMIT 10;
SELECT * FROM v_server_member_roles LIMIT 10;
