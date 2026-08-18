"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { getSlotsForMemberService, getAvailableDaysInRange } from "@/lib/booking-slots";
import type { ActionResult } from "@/app/login/actions";

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
): Promise<ActionResult & { bookingId?: string }> {
  const user = await requireUser();

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
  return { ok: true, bookingId: booking.id };
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
