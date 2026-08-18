"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getSlotsForMemberService, getAvailableDaysInRange } from "@/lib/booking-slots";
import type { ActionResult } from "@/app/login/actions";

export async function getRescheduleDatesAction(
  bookingId: string,
  fromIso: string,
  toIso: string,
): Promise<{ ok: true; dates: string[] } | { ok: false; error: string }> {
  const user = await requireUser();

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: user.id },
    include: { service: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };

  const dates = await getAvailableDaysInRange(
    booking.storeMemberId,
    booking.service.durationMin,
    fromIso,
    toIso,
    bookingId,
  );
  return { ok: true, dates };
}

export async function getRescheduleSlotsAction(
  bookingId: string,
  dateIso: string,
): Promise<{ ok: true; slots: number[] } | { ok: false; error: string }> {
  const user = await requireUser();

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: user.id },
    include: { service: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };

  const slots = await getSlotsForMemberService(booking.storeMemberId, booking.service.durationMin, dateIso, bookingId);
  return { ok: true, slots };
}

export async function rescheduleBookingAction(
  bookingId: string,
  dateIso: string,
  startMinute: number,
): Promise<ActionResult> {
  const user = await requireUser();

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: user.id },
    include: { service: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (!["PENDING_CONFIRMATION", "CONFIRMED"].includes(booking.status)) {
    return { ok: false, error: "This booking can't be changed anymore" };
  }

  const stillAvailable = (
    await getSlotsForMemberService(booking.storeMemberId, booking.service.durationMin, dateIso, bookingId)
  ).includes(startMinute);
  if (!stillAvailable) return { ok: false, error: "That time was just taken, pick another" };

  const startAt = new Date(`${dateIso}T00:00:00.000Z`);
  startAt.setUTCMinutes(startMinute);
  const endAt = new Date(startAt.getTime() + booking.service.durationMin * 60_000);

  // Moving the time means the staff member should reconfirm it, so this
  // resets to pending even if it was already confirmed. rescheduledAt lets
  // the staff queue show "moved" instead of looking like a brand new request.
  await prisma.booking.update({
    where: { id: booking.id },
    data: { startAt, endAt, status: "PENDING_CONFIRMATION", rescheduledAt: new Date() },
  });

  revalidatePath("/account");
  return { ok: true };
}

export async function cancelBookingAction(bookingId: string): Promise<ActionResult> {
  const user = await requireUser();

  const result = await prisma.booking.updateMany({
    where: { id: bookingId, userId: user.id, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } },
    data: { status: "CANCELLED" },
  });
  if (result.count === 0) return { ok: false, error: "Booking not found" };

  revalidatePath("/account");
  return { ok: true };
}

// Called when the customer actually opens the tab where an unseen
// status-change lives, that's the whole "notification," a badge that
// disappears once looked at, not a separate read/unread toggle to manage.
export async function markBookingsSeenAction(bookingIds: string[]): Promise<ActionResult> {
  const user = await requireUser();
  if (bookingIds.length === 0) return { ok: true };

  await prisma.booking.updateMany({
    where: { id: { in: bookingIds }, userId: user.id, clientSeenStatusAt: null },
    data: { clientSeenStatusAt: new Date() },
  });

  return { ok: true };
}

export async function removeFavoriteAction(storeId: string): Promise<ActionResult> {
  const user = await requireUser();

  await prisma.favorite.deleteMany({ where: { userId: user.id, storeId } });
  revalidatePath("/account");
  return { ok: true };
}
