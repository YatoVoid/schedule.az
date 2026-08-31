"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/auth";
import { availabilitySchema, availabilityExceptionSchema, chargedPriceSchema } from "@/lib/validation";
import { enqueueConfirmation } from "@/lib/reminders/enqueue";
import type { ActionResult } from "@/app/login/actions";

export async function setAvailabilityAction(
  slug: string,
  input: { dayOfWeek: string; open: boolean; startMinute: string; endMinute: string },
): Promise<ActionResult> {
  const { membership } = await requireStoreMember(slug);

  if (!input.open) {
    await prisma.staffAvailability.deleteMany({
      where: { storeMemberId: membership.id, dayOfWeek: Number(input.dayOfWeek) },
    });
    revalidatePath(`/staff/${slug}`);
    return { ok: true };
  }

  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (parsed.data.endMinute <= parsed.data.startMinute) {
    return { ok: false, error: "End time must be after start time" };
  }

  await prisma.staffAvailability.upsert({
    where: {
      storeMemberId_dayOfWeek: {
        storeMemberId: membership.id,
        dayOfWeek: parsed.data.dayOfWeek,
      },
    },
    update: { startMinute: parsed.data.startMinute, endMinute: parsed.data.endMinute },
    create: {
      storeMemberId: membership.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startMinute: parsed.data.startMinute,
      endMinute: parsed.data.endMinute,
    },
  });

  revalidatePath(`/staff/${slug}`);
  return { ok: true };
}

export async function addExceptionAction(
  slug: string,
  input: { startDate: string; endDate: string; type: "BUSY" | "FREE"; recurringAnnually: boolean; label: string },
): Promise<ActionResult> {
  const { membership } = await requireStoreMember(slug);

  const parsed = availabilityExceptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.availabilityException.create({
    data: {
      storeMemberId: membership.id,
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      type: parsed.data.type,
      recurringAnnually: parsed.data.recurringAnnually,
      label: parsed.data.label || null,
    },
  });

  revalidatePath(`/staff/${slug}`);
  return { ok: true };
}

export async function updateExceptionAction(
  slug: string,
  exceptionId: string,
  input: { startDate: string; endDate: string; type: "BUSY" | "FREE"; recurringAnnually: boolean; label: string },
): Promise<ActionResult> {
  const { membership } = await requireStoreMember(slug);

  const parsed = availabilityExceptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const result = await prisma.availabilityException.updateMany({
    where: { id: exceptionId, storeMemberId: membership.id },
    data: {
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      type: parsed.data.type,
      recurringAnnually: parsed.data.recurringAnnually,
      label: parsed.data.label || null,
    },
  });
  if (result.count === 0) return { ok: false, error: "Not found" };

  revalidatePath(`/staff/${slug}`);
  return { ok: true };
}

export async function deleteExceptionAction(slug: string, exceptionId: string): Promise<ActionResult> {
  const { membership } = await requireStoreMember(slug);

  const result = await prisma.availabilityException.deleteMany({
    where: { id: exceptionId, storeMemberId: membership.id },
  });
  if (result.count === 0) return { ok: false, error: "Not found" };

  revalidatePath(`/staff/${slug}`);
  return { ok: true };
}

export async function respondToBookingAction(
  slug: string,
  bookingId: string,
  status: "CONFIRMED" | "DECLINED",
  note: string,
): Promise<ActionResult> {
  const { membership } = await requireStoreMember(slug);

  const result = await prisma.booking.updateMany({
    where: { id: bookingId, storeMemberId: membership.id, status: "PENDING_CONFIRMATION" },
    data: { status, note: note.trim() || undefined, clientSeenStatusAt: null },
  });
  if (result.count === 0) return { ok: false, error: "Booking not found or already handled" };

  if (status === "CONFIRMED") {
    await enqueueConfirmation(bookingId).catch((err) =>
      console.error("[reminders] failed to queue confirmation", err),
    );
  }

  revalidatePath(`/staff/${slug}`);
  return { ok: true };
}

export async function completeBookingAction(
  slug: string,
  bookingId: string,
  chargedPrice: string,
): Promise<ActionResult> {
  const { membership } = await requireStoreMember(slug);

  const parsed = chargedPriceSchema.safeParse(chargedPrice);
  if (!parsed.success) return { ok: false, error: "Enter a valid amount" };

  const result = await prisma.booking.updateMany({
    where: { id: bookingId, storeMemberId: membership.id, status: "CONFIRMED" },
    data: { status: "COMPLETED", priceAzn: parsed.data },
  });
  if (result.count === 0) return { ok: false, error: "Booking not found or not confirmed yet" };

  revalidatePath(`/staff/${slug}`);
  return { ok: true };
}
