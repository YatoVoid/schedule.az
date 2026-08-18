-- CreateEnum
CREATE TYPE "AvailabilityExceptionType" AS ENUM ('BUSY', 'FREE');

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "storeMemberId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "AvailabilityExceptionType" NOT NULL,
    "recurringAnnually" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityException_storeMemberId_idx" ON "AvailabilityException"("storeMemberId");

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_storeMemberId_fkey" FOREIGN KEY ("storeMemberId") REFERENCES "StoreMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
