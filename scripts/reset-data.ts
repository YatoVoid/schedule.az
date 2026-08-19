// Wipes all business/booking data for a clean slate. Deleting Store cascades
// everything tenant-owned (Service, StoreMember, StoreImage, Booking,
// Favorite, and — through StoreMember — StaffAvailability and
// AvailabilityException), per the onDelete: Cascade rules in schema.prisma.
// User rows (and their phone/email login identity) are left untouched
// except for clearing the display name, so every phone number that could
// log in before can still log in after, starting from a blank account.
import { rm } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.otpCode.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.updateMany({ data: { name: null } });

  await rm(path.join(process.cwd(), "storage", "logos"), { recursive: true, force: true });
  await rm(path.join(process.cwd(), "storage", "store-images"), { recursive: true, force: true });

  console.log("All business data cleared. User accounts (and their phone/email logins) kept.");
}

main().finally(() => prisma.$disconnect());
