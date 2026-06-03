-- Expand notifications beyond message-only records.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FRIEND_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GROUP_INVITE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INCOMING_CALL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MISSED_CALL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM';

ALTER TABLE "notifications"
  ALTER COLUMN "actorId" DROP NOT NULL,
  ALTER COLUMN "groupId" DROP NOT NULL,
  ALTER COLUMN "channelId" DROP NOT NULL,
  ALTER COLUMN "messageId" DROP NOT NULL,
  ADD COLUMN "call_id" TEXT,
  ADD COLUMN "data_json" JSONB,
  ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "notifications_userId_type_createdAt_idx" ON "notifications"("userId", "type", "createdAt");
CREATE INDEX "notifications_call_id_idx" ON "notifications"("call_id");
