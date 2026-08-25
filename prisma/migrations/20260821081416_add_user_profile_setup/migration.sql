-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT,
ADD COLUMN     "avatarMimeType" TEXT,
ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
