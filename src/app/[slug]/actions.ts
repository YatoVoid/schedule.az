"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { getSlotsForMemberService, getAvailableDaysInRange } from "@/lib/booking-slots";
import { reviewSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";
import { TERMS_VERSION } from "@/lib/terms";
import { logSecurityEvent } from "@/lib/security-log";

const MAX_PENDING_BOOKINGS_PER_USER = 3;
const MAX_BOOKINGS_PER_USER_PER_DAY = 10;

export async function getAvailableDatesAction(
  storeMemberId: string,
  serviceId: string,
  fromIso: string,
  toIso: string,
): Promise<{ ok: true; dates: string[] } | { ok: false; error: string }> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return { ok: false, error: "Service not found" };

  const dates = await getAvailableDaysInRange(storeMemberId, service.durationMin, fromIso, toIso);
  return { ok: true, dates };
}

export async function getAvailableSlotsAction(
  storeMemberId: string,
  serviceId: string,
  dateIso: string,
): Promise<{ ok: true; slots: number[] } | { ok: false; error: string }> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return { ok: false, error: "Service not found" };

  const slots = await getSlotsForMemberService(storeMemberId, service.durationMin, dateIso);
  return { ok: true, slots };
}

export async function getCurrentUserBriefAction(): Promise<{
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  termsVersion: string | null;
} | null> {
  return getCurrentUser();
}

export async function setNameAction(name: string): Promise<ActionResult> {
  const user = await requireUser();
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Enter your name" };
  if (trimmed.length > 80) return { ok: false, error: "Name is too long" };

  await prisma.user.update({ where: { id: user.id }, data: { name: trimmed } });
  return { ok: true };
}

export async function createBookingAction(
  storeSlug: string,
  storeMemberId: string,
  serviceId: string,
  dateIso: string,
  startMinute: number,
  acceptTerms = false,
): Promise<ActionResult & { bookingId?: string; startAt?: string; endAt?: string }> {
  const user = await requireUser();

  // Accounts that signed in before the current Terms version agree here
  // instead, so nobody books under terms they never accepted.
  if (user.termsVersion !== TERMS_VERSION) {
    if (!acceptTerms) return { ok: false, error: "Tick the box to agree to the Terms before booking." };
    await prisma.user.update({
      where: { id: user.id },
      data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
    });
  }

  // Booking requests notify staff and, once accepted, send a paid SMS, so
  // one account can't flood a business or the message budget.
  const [waiting, createdToday] = await Promise.all([
    prisma.booking.count({ where: { userId: user.id, status: "PENDING_CONFIRMATION" } }),
    prisma.booking.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  if (waiting >= MAX_PENDING_BOOKINGS_PER_USER) {
    await logSecurityEvent("BOOKING_LIMIT_HIT", { userId: user.id, detail: `pending=${waiting}` });
    return {
      ok: false,
      error: `You have ${waiting} bookings waiting for a business to confirm. Wait for a reply before booking more.`,
    };
  }
  if (createdToday >= MAX_BOOKINGS_PER_USER_PER_DAY) {
    await logSecurityEvent("BOOKING_LIMIT_HIT", { userId: user.id, detail: `today=${createdToday}` });
    return { ok: false, error: "You've made the most bookings allowed in one day. Try again tomorrow." };
  }

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return { ok: false, error: "Business not found" };

  const [service, storeMember] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, storeId: store.id, active: true } }),
    prisma.storeMember.findFirst({ where: { id: storeMemberId, storeId: store.id } }),
  ]);
  if (!service || !storeMember) return { ok: false, error: "That option is no longer available" };

  // Re-check the slot is still free server-side, closes the obvious race
  // where two people grab the same slot in the gap between "load slots" and
  // "confirm booking."
  const stillAvailable = (await getSlotsForMemberService(storeMemberId, service.durationMin, dateIso)).includes(
    startMinute,
  );
  if (!stillAvailable) return { ok: false, error: "That time was just taken, pick another" };

  const startAt = new Date(`${dateIso}T00:00:00.000Z`);
  startAt.setUTCMinutes(startMinute);
  const endAt = new Date(startAt.getTime() + service.durationMin * 60_000);

  const booking = await prisma.booking.create({
    data: {
      storeId: store.id,
      serviceId: service.id,
      storeMemberId: storeMember.id,
      userId: user.id,
      startAt,
      endAt,
      status: "PENDING_CONFIRMATION",
    },
  });

  revalidatePath(`/staff/${storeSlug}`);
  return { ok: true, bookingId: booking.id, startAt: startAt.toISOString(), endAt: endAt.toISOString() };
}

export async function toggleFavoriteAction(storeId: string): Promise<ActionResult & { favorited?: boolean }> {
  const user = await requireUser();

  const existing = await prisma.favorite.findUnique({
    where: { userId_storeId: { userId: user.id, storeId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { ok: true, favorited: false };
  }

  await prisma.favorite.create({ data: { userId: user.id, storeId } });
  return { ok: true, favorited: true };
}

// Only someone who's actually had a completed appointment here can leave a
// rating — keeps this a record of real experience, not open to anyone who
// just found the page.
export async function canReviewAction(storeSlug: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) return false;

  const completedBooking = await prisma.booking.findFirst({
    where: { userId: user.id, storeId: store.id, status: "COMPLETED" },
    select: { id: true },
  });
  return !!completedBooking;
}

// Every rating gets identical treatment regardless of the number chosen —
// no routing by sentiment (that's "review gating," which Google's review
// policies prohibit). The rating and message are always saved the same
// way, visible to the store's admins; whether to also post on Google is a
// separate, always-available choice offered to every reviewer equally
// (see googleReviewUrl in the return value), never automatic.
export async function submitReviewAction(
  storeSlug: string,
  input: { rating: number; message: string },
): Promise<ActionResult & { googleReviewUrl?: string | null }> {
  const user = await requireUser();

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return { ok: false, error: "Business not found" };

  const completedBooking = await prisma.booking.findFirst({
    where: { userId: user.id, storeId: store.id, status: "COMPLETED" },
    select: { id: true },
  });
  if (!completedBooking) return { ok: false, error: "Only past customers can leave a rating here" };

  const message = (parsed.data.message ?? "").trim() || null;
  await prisma.review.upsert({
    where: { userId_storeId: { userId: user.id, storeId: store.id } },
    update: { rating: parsed.data.rating, message },
    create: { userId: user.id, storeId: store.id, rating: parsed.data.rating, message },
  });

  revalidatePath(`/${storeSlug}`);
  revalidatePath(`/admin/${storeSlug}/reviews`);
  return { ok: true, googleReviewUrl: store.googleReviewUrl };
}
