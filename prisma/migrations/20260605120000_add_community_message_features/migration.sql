CREATE TYPE "MessageReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_OR_ABUSE', 'NSFW', 'OTHER');
CREATE TYPE "MessageReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

ALTER TABLE "messages"
  ADD COLUMN "reply_to_message_id" TEXT,
  ADD COLUMN "pinned_at" TIMESTAMP(3),
  ADD COLUMN "pinned_by_id" TEXT;

CREATE TABLE "message_reactions" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "polls" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "poll_options" (
  "id" TEXT NOT NULL,
  "pollId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "poll_votes" (
  "id" TEXT NOT NULL,
  "pollId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_reports" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "reason" "MessageReportReason" NOT NULL,
  "details" TEXT,
  "status" "MessageReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  CONSTRAINT "message_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "message_reactions"("messageId", "userId", "emoji");
CREATE INDEX "message_reactions_messageId_idx" ON "message_reactions"("messageId");
CREATE INDEX "message_reactions_userId_idx" ON "message_reactions"("userId");

CREATE UNIQUE INDEX "polls_messageId_key" ON "polls"("messageId");
CREATE INDEX "poll_options_pollId_position_idx" ON "poll_options"("pollId", "position");
CREATE UNIQUE INDEX "poll_votes_pollId_userId_key" ON "poll_votes"("pollId", "userId");
CREATE INDEX "poll_votes_optionId_idx" ON "poll_votes"("optionId");
CREATE INDEX "poll_votes_userId_idx" ON "poll_votes"("userId");

CREATE INDEX "message_reports_groupId_status_createdAt_idx" ON "message_reports"("groupId", "status", "createdAt");
CREATE INDEX "message_reports_channelId_idx" ON "message_reports"("channelId");
CREATE INDEX "message_reports_messageId_idx" ON "message_reports"("messageId");
CREATE INDEX "message_reports_reporterId_idx" ON "message_reports"("reporterId");
CREATE INDEX "message_reports_reviewedById_idx" ON "message_reports"("reviewedById");

CREATE INDEX "messages_reply_to_message_id_idx" ON "messages"("reply_to_message_id");
CREATE INDEX "messages_pinned_at_idx" ON "messages"("pinned_at");
CREATE INDEX "messages_pinned_by_id_idx" ON "messages"("pinned_by_id");

ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_pinned_by_id_fkey" FOREIGN KEY ("pinned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "polls" ADD CONSTRAINT "polls_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
