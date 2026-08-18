import { prisma } from "../src/lib/prisma";
import { getAvailableDaysInRange } from "../src/lib/booking-slots";
import { dateToIso } from "../src/lib/schedule";

async function main() {
  const store = await prisma.store.findFirst({ where: { slug: "kingston-test" } });
  const staff = await prisma.storeMember.findFirst({ where: { storeId: store!.id, user: { phone: "+994502222222" } } });
  const service = await prisma.service.findFirst({ where: { storeId: store!.id } });

  // Reset to a known state: only Tuesdays open, 9-18.
  await prisma.staffAvailability.deleteMany({ where: { storeMemberId: staff!.id } });
  await prisma.staffAvailability.create({
    data: { storeMemberId: staff!.id, dayOfWeek: 2, startMinute: 540, endMinute: 1080 },
  });
  await prisma.availabilityException.deleteMany({ where: { storeMemberId: staff!.id } });

  const today = new Date();
  const from = dateToIso(today);
  const to = dateToIso(new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000));

  const days = await getAvailableDaysInRange(staff!.id, service!.durationMin, from, to);
  console.log("available days in next 20:", days);
  const allTuesdays = days.every((d) => new Date(`${d}T00:00:00.000Z`).getUTCDay() === 2);
  console.log("all returned days are Tuesdays:", allTuesdays);

  // Now add a BUSY exception covering the very next Tuesday in range, should disappear.
  if (days.length > 0) {
    const target = days[0];
    await prisma.availabilityException.create({
      data: {
        storeMemberId: staff!.id,
        startDate: new Date(`${target}T00:00:00.000Z`),
        endDate: new Date(`${target}T00:00:00.000Z`),
        type: "BUSY",
        recurringAnnually: false,
      },
    });
    const daysAfterBusy = await getAvailableDaysInRange(staff!.id, service!.durationMin, from, to);
    console.log("target day removed after BUSY exception:", !daysAfterBusy.includes(target));
  }

  // FREE exception on a normally-closed Wednesday should add it.
  const wednesday = new Date(today);
  while (wednesday.getDay() !== 3) wednesday.setDate(wednesday.getDate() + 1);
  const wedIso = dateToIso(wednesday);
  await prisma.availabilityException.create({
    data: {
      storeMemberId: staff!.id,
      startDate: new Date(`${wedIso}T00:00:00.000Z`),
      endDate: new Date(`${wedIso}T00:00:00.000Z`),
      type: "FREE",
      recurringAnnually: false,
    },
  });
  const daysAfterFree = await getAvailableDaysInRange(staff!.id, service!.durationMin, from, to);
  console.log("free-exception Wednesday now included:", daysAfterFree.includes(wedIso));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
