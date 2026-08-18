import { prisma } from "../src/lib/prisma";

async function main() {
  const store = await prisma.store.findFirst({ where: { slug: "kingston-test" } });
  const staff = await prisma.storeMember.findFirst({ where: { storeId: store!.id, user: { phone: "+994502222222" } } });
  const service = await prisma.service.findFirst({ where: { storeId: store!.id } });
  const customer = await prisma.user.findFirst({ where: { phone: "+994503333333" } });

  await prisma.booking.deleteMany({ where: { storeId: store!.id, userId: customer!.id } });

  // A CONFIRMED booking already in the past, to test the "needs completion" bucket.
  const overdue = await prisma.booking.create({
    data: {
      storeId: store!.id,
      serviceId: service!.id,
      storeMemberId: staff!.id,
      userId: customer!.id,
      startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + service!.durationMin * 60_000),
      status: "CONFIRMED",
    },
  });

  // Mirrors completeBookingAction / adminCompleteBookingAction exactly.
  const completed = await prisma.booking.update({
    where: { id: overdue.id },
    data: { status: "COMPLETED", priceAzn: "35.00" },
  });
  console.log("completed:", completed.status, completed.priceAzn?.toString());

  // A second booking, rescheduled, to test the staff "Rescheduled" badge.
  const rescheduleTarget = await prisma.booking.create({
    data: {
      storeId: store!.id,
      serviceId: service!.id,
      storeMemberId: staff!.id,
      userId: customer!.id,
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + service!.durationMin * 60_000),
      status: "PENDING_CONFIRMATION",
    },
  });
  await prisma.booking.update({
    where: { id: rescheduleTarget.id },
    data: { rescheduledAt: new Date() },
  });
  console.log("reschedule-flagged booking:", rescheduleTarget.id);

  // A COMPLETED booking this month with a real charged price, to test revenue analytics.
  const thisMonthCompleted = await prisma.booking.create({
    data: {
      storeId: store!.id,
      serviceId: service!.id,
      storeMemberId: staff!.id,
      userId: customer!.id,
      startAt: new Date(),
      endAt: new Date(Date.now() + service!.durationMin * 60_000),
      status: "COMPLETED",
      priceAzn: "40.00",
    },
  });
  console.log("this-month completed for revenue check:", thisMonthCompleted.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
