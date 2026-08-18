import { prisma } from "../src/lib/prisma";
import { getSlotsForMemberService } from "../src/lib/booking-slots";
import { dateToIso } from "../src/lib/schedule";

async function main() {
  const store = await prisma.store.findFirst({ where: { slug: "kingston-test" } });
  const staff = await prisma.storeMember.findFirst({ where: { storeId: store!.id, user: { phone: "+994502222222" } } });
  const service = await prisma.service.findFirst({ where: { storeId: store!.id } });
  const customer = await prisma.user.upsert({
    where: { phone: "+994503333333" },
    update: {},
    create: { phone: "+994503333333", name: "Consumer Test" },
  });

  const todayIso = dateToIso(new Date());
  const slots = await getSlotsForMemberService(staff!.id, service!.durationMin, todayIso);
  console.log("available slots today:", slots.length, "first:", slots[0]);

  if (slots.length === 0) throw new Error("no slots to test booking against");
  const pick = slots[0];

  // Mirrors createBookingAction exactly.
  const startAt = new Date(`${todayIso}T00:00:00.000Z`);
  startAt.setUTCMinutes(pick);
  const endAt = new Date(startAt.getTime() + service!.durationMin * 60_000);
  const booking = await prisma.booking.create({
    data: {
      storeId: store!.id,
      serviceId: service!.id,
      storeMemberId: staff!.id,
      userId: customer.id,
      startAt,
      endAt,
      status: "PENDING_CONFIRMATION",
    },
  });
  console.log("booking created:", booking.id, booking.startAt.toISOString());

  // The exact same slot should now be gone from availability.
  const slotsAfter = await getSlotsForMemberService(staff!.id, service!.durationMin, todayIso);
  console.log("picked slot excluded after booking:", !slotsAfter.includes(pick));

  // Reschedule check: excludeBookingId should show the booking's own slot as free again.
  const slotsExcluding = await getSlotsForMemberService(staff!.id, service!.durationMin, todayIso, booking.id);
  console.log("slot available again when excluding own booking (reschedule case):", slotsExcluding.includes(pick));

  console.log("BOOKING_ID=" + booking.id);
  console.log("CUSTOMER_ID=" + customer.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
