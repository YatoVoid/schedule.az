import { prisma } from "../src/lib/prisma";

async function main() {
  const store = await prisma.store.findFirst({ where: { slug: "kingston-test" } });
  const staffMember = await prisma.storeMember.findFirst({ where: { storeId: store!.id, user: { phone: "0001" } } });
  if (!staffMember) throw new Error("0001 staff member not found, run scripts/verify-dev-test-phone.ts first");

  // Mirrors updateStaffNameAction
  await prisma.user.update({ where: { id: staffMember.userId }, data: { name: "Admin-Edited Name" } });
  const afterName = await prisma.user.findUnique({ where: { id: staffMember.userId } });
  console.log("name updated by admin path:", afterName?.name === "Admin-Edited Name");

  // Mirrors adminSetAvailabilityAction (open=true branch)
  await prisma.staffAvailability.upsert({
    where: { storeMemberId_dayOfWeek: { storeMemberId: staffMember.id, dayOfWeek: 2 } },
    update: { startMinute: 600, endMinute: 1020 },
    create: { storeMemberId: staffMember.id, dayOfWeek: 2, startMinute: 600, endMinute: 1020 },
  });
  const avail = await prisma.staffAvailability.findUnique({
    where: { storeMemberId_dayOfWeek: { storeMemberId: staffMember.id, dayOfWeek: 2 } },
  });
  console.log("availability set by admin path:", avail?.startMinute, avail?.endMinute);

  // Mirrors adminAddExceptionAction
  await prisma.availabilityException.deleteMany({ where: { storeMemberId: staffMember.id } });
  const ex = await prisma.availabilityException.create({
    data: {
      storeMemberId: staffMember.id,
      startDate: new Date("2026-12-25T00:00:00.000Z"),
      endDate: new Date("2026-12-25T00:00:00.000Z"),
      type: "BUSY",
      recurringAnnually: true,
      label: "Set by admin",
    },
  });
  console.log("exception added by admin path:", ex.label, ex.recurringAnnually);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
