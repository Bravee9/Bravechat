-- A retry from the same author/channel must return the same persisted message.
CREATE UNIQUE INDEX "messages_author_id_channel_id_nonce_key" ON "messages"("author_id", "channel_id", "nonce");
