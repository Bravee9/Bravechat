ALTER TABLE "direct_messages" ADD COLUMN "nonce" TEXT,
  ADD COLUMN "reply_to_id" TEXT,
  ADD COLUMN "is_edited" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "edited_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "direct_messages_sender_id_receiver_id_nonce_key" ON "direct_messages"("sender_id", "receiver_id", "nonce");
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "direct_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "direct_message_reactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "message_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "emoji" VARCHAR(32) NOT NULL,
  CONSTRAINT "direct_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "direct_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "direct_message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "direct_message_reactions_message_id_user_id_emoji_key" ON "direct_message_reactions"("message_id", "user_id", "emoji");
CREATE TABLE "password_reset_tokens" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
