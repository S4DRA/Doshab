ALTER TABLE "groups"
ADD COLUMN "is_direct_message" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "direct_message_key" TEXT;

CREATE UNIQUE INDEX "groups_direct_message_key_key" ON "groups"("direct_message_key");
