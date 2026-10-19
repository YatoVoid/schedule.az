-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SecurityEventType" ADD VALUE 'SEND_BUDGET_HIT';
ALTER TYPE "SecurityEventType" ADD VALUE 'BOOKING_LIMIT_HIT';
ALTER TYPE "SecurityEventType" ADD VALUE 'IMAGE_REJECTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;

-- CreateTable
CREATE TABLE "MessageSend" (
    "id" TEXT NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageSend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageSend_channel_createdAt_idx" ON "MessageSend"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "MessageSend_recipient_createdAt_idx" ON "MessageSend"("recipient", "createdAt");

-- CreateIndex
CREATE INDEX "MessageSend_ip_createdAt_idx" ON "MessageSend"("ip", "createdAt");
