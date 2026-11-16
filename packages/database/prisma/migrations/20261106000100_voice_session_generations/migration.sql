ALTER TABLE "channels" ADD COLUMN "voice_epoch" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "voice_sessions" (
  "channel_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "epoch" INTEGER NOT NULL,
  CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("channel_id", "session_id", "epoch"),
  CONSTRAINT "voice_sessions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "voice_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "refresh_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "voice_sessions_session_id_idx" ON "voice_sessions"("session_id");
