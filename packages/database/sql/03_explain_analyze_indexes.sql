-- ============================================================================
-- 03_explain_analyze_indexes.sql
-- Kiểm chứng kế hoạch thực thi (Execution Plan) và hiệu quả Index trên PostgreSQL
-- ============================================================================

-- 1. Cursor Pagination theo (channel_id, created_at) sử dụng idx idx_messages_channel_created
EXPLAIN ANALYZE
SELECT id, author_id, content, created_at
FROM messages
WHERE channel_id = (SELECT id FROM channels ORDER BY created_at ASC LIMIT 1)
  AND is_deleted = false
ORDER BY created_at DESC, id DESC
LIMIT 50;

-- 2. Kiểm tra truy vấn lịch sử tin nhắn trực tiếp (DM) theo idx (sender_id, receiver_id, created_at)
EXPLAIN ANALYZE
SELECT id, sender_id, receiver_id, content, created_at
FROM direct_messages
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 50;

-- 3. Kiểm tra truy vấn nhật ký quản trị theo idx (server_id, created_at)
EXPLAIN ANALYZE
SELECT al.id, al.action, al.detail, al.created_at, u.username
FROM audit_logs al
INNER JOIN users u ON u.id = al.actor_id
ORDER BY al.created_at DESC
LIMIT 50;
