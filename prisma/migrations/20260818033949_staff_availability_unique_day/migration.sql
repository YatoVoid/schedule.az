-- AlterTable
CREATE UNIQUE INDEX "StaffAvailability_storeMemberId_dayOfWeek_key" ON "StaffAvailability"("storeMemberId", "dayOfWeek");
