-- AlterEnum
ALTER TYPE "ReminderKind" ADD VALUE 'CONFIRMATION';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "rescheduleCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "OtpCode_createdAt_idx" ON "OtpCode"("createdAt");
