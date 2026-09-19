CREATE TABLE "music_sessions" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "state" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "music_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "music_sessions_channelId_key" ON "music_sessions"("channelId");
CREATE INDEX "music_sessions_updatedAt_idx" ON "music_sessions"("updatedAt");
ALTER TABLE "music_sessions" ADD CONSTRAINT "music_sessions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
