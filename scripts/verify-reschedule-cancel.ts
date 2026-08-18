import { prisma } from "../src/lib/prisma";
import { getSlotsForMemberService } from "../src/lib/booking-slots";
import { dateToIso } from "../src/lib/schedule";

async function main() {
  const booking = await prisma.booking.findFirst({
    where: { userId: (await prisma.user.findFirst({ where: { phone: "+994503333333" } }))!.id },
    include: { service: true },
    orderBy: { createdAt: "desc" },
  });
  if (!booking) throw new Error("run scripts/verify-consumer-flow.ts first");

  const todayIso = dateToIso(new Date());
  const slots = await getSlotsForMemberService(booking.storeMemberId, booking.service.durationMin, todayIso, booking.id);
  const newSlot = slots.find((s) => s !== booking.startAt.getUTCHours() * 60 + booking.startAt.getUTCMinutes());
  if (newSlot === undefined) throw new Error("no alternate slot to reschedule to");

  // Mirrors rescheduleBookingAction exactly.
  const startAt = new Date(`${todayIso}T00:00:00.000Z`);
  startAt.setUTCMinutes(newSlot);
  const endAt = new Date(startAt.getTime() + booking.service.durationMin * 60_000);
  await prisma.booking.update({
    where: { id: booking.id },
    data: { startAt, endAt, status: "PENDING_CONFIRMATION" },
  });
  const rescheduled = await prisma.booking.findUnique({ where: { id: booking.id } });
  console.log("rescheduled to:", rescheduled?.startAt.toISOString(), "status:", rescheduled?.status);

  // Mirrors cancelBookingAction exactly.
  const cancelResult = await prisma.booking.updateMany({
    where: { id: booking.id, userId: booking.userId, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } },
    data: { status: "CANCELLED" },
  });
  console.log("cancel count:", cancelResult.count);
  const cancelled = await prisma.booking.findUnique({ where: { id: booking.id } });
  console.log("final status:", cancelled?.status);

  // Cancelling again should affect 0 rows (already cancelled, not pending/confirmed).
  const secondCancel = await prisma.booking.updateMany({
    where: { id: booking.id, userId: booking.userId, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } },
    data: { status: "CANCELLED" },
  });
  console.log("double-cancel is a no-op:", secondCancel.count === 0);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
