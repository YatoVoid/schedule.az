import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pickChannel } from "@/lib/reminders/channel";

// Queues the one-off "your booking is confirmed" message when staff or an
// admin accept a pending booking. It goes through the same ScheduledReminder
// table as the scheduled reminders, so it inherits the retry, dedupe,
// per-user cap and channel handling; the in-process loop picks it up within
// a tick.
//
// The dedupe key carries the booking's start time, so a reschedule to a new
// time produces a fresh confirmation while a double-submit of the same
// accept does not. Callers should not let a failure here block the accept
// itself.
export async function enqueueConfirmation(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      startAt: true,
      userId: true,
      storeId: true,
      user: { select: { phone: true, email: true } },
    },
  });
  if (!booking || booking.status !== "CONFIRMED") return;

  const channel = pickChannel(booking.user);
  const now = new Date();

  try {
    await prisma.scheduledReminder.create({
      data: {
        kind: "CONFIRMATION",
        channel: channel ?? "EMAIL",
        status: channel ? "PENDING" : "SKIPPED",
        lastError: channel ? null : "no contact channel",
        dedupeKey: `confirm:${booking.id}:${booking.startAt.getTime()}`,
        userId: booking.userId,
        storeId: booking.storeId,
        bookingId: booking.id,
        sendAt: now,
        sourceAt: booking.startAt,
      },
    });
  } catch (err) {
    // Already queued for this booking+time (double submit) — nothing to do.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  }
}
