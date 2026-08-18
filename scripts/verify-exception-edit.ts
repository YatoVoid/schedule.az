import { prisma } from "../src/lib/prisma";

async function main() {
  const store = await prisma.store.findFirst({ where: { slug: "kingston-test" } });
  if (!store) throw new Error("run scripts/verify-flow.ts first");
  const staffMember = await prisma.storeMember.findFirst({ where: { storeId: store.id, role: "STAFF" } });
  if (!staffMember) throw new Error("no staff member seeded");

  await prisma.availabilityException.deleteMany({ where: { storeMemberId: staffMember.id } });

  const created = await prisma.availabilityException.create({
    data: {
      storeMemberId: staffMember.id,
      startDate: new Date("2026-03-20T00:00:00.000Z"),
      endDate: new Date("2026-03-20T00:00:00.000Z"),
      type: "BUSY",
      recurringAnnually: false,
      label: "Dentist",
    },
  });
  console.log("created:", created.label, created.startDate.toISOString().slice(0, 10));

  // Mirrors exactly what updateExceptionAction does.
  const updated = await prisma.availabilityException.updateMany({
    where: { id: created.id, storeMemberId: staffMember.id },
    data: {
      startDate: new Date("2026-03-20T00:00:00.000Z"),
      endDate: new Date("2026-03-27T00:00:00.000Z"),
      type: "BUSY",
      recurringAnnually: true,
      label: "Extended trip",
    },
  });
  console.log("update count:", updated.count);

  const row = await prisma.availabilityException.findUnique({ where: { id: created.id } });
  console.log(
    "after update:",
    row?.label,
    row?.startDate.toISOString().slice(0, 10),
    "->",
    row?.endDate.toISOString().slice(0, 10),
    "annual:",
    row?.recurringAnnually,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
