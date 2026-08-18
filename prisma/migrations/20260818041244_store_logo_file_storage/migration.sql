-- AlterTable
ALTER TABLE "Store" DROP COLUMN "logoUrl";
ALTER TABLE "Store" ADD COLUMN "logoMimeType" TEXT;
ALTER TABLE "Store" ADD COLUMN "logoUpdatedAt" TIMESTAMP(3);
