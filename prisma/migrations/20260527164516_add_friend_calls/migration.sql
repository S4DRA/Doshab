-- CreateEnum
CREATE TYPE "FriendCallStatus" AS ENUM ('RINGING', 'ACCEPTED', 'DECLINED', 'MISSED', 'ENDED');

-- CreateTable
CREATE TABLE "friend_calls" (
    "id" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "status" "FriendCallStatus" NOT NULL DEFAULT 'RINGING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friend_calls_roomName_key" ON "friend_calls"("roomName");

-- CreateIndex
CREATE INDEX "friend_calls_callerId_createdAt_idx" ON "friend_calls"("callerId", "createdAt");

-- CreateIndex
CREATE INDEX "friend_calls_receiverId_status_expiresAt_idx" ON "friend_calls"("receiverId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "friend_calls" ADD CONSTRAINT "friend_calls_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_calls" ADD CONSTRAINT "friend_calls_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
