"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { availabilitySchema, availabilityExceptionSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";
import type { SetAvailabilityInput } from "@/components/availability-editor";
import type { ExceptionFormState } from "@/components/exception-manager";

// Every action here is admin-only and takes an explicit target memberId,
// unlike the staff-self actions in app/staff/[slug]/actions.ts which always
// act on the caller's own membership. This is what lets an admin manage any
// staff member's hours/exceptions exactly like the staff member could
// themselves (same underlying schema, same UI components).
async function requireTargetMember(slug: string, memberId: string) {
  const { membership: admin } = await requireStoreAdmin(slug);
  const target = await prisma.storeMember.findFirst({
    where: { id: memberId, storeId: admin.storeId },
  });
  if (!target) throw new Error("Team member not found");
  return { admin, target };
}

export async function updateStaffNameAction(slug: string, memberId: string, name: string): Promise<ActionResult> {
  const { target } = await requireTargetMember(slug, memberId);

  const trimmed = name.trim();
  if (trimmed.length > 80) return { ok: false, error: "Name is too long" };

  await prisma.user.update({
    where: { id: target.userId },
    data: { name: trimmed || null },
  });

  revalidatePath(`/admin/${slug}/staff/${memberId}`);
  revalidatePath(`/admin/${slug}/staff`);
  return { ok: true };
}

export async function adminSetAvailabilityAction(
  slug: string,
  memberId: string,
  input: SetAvailabilityInput,
): Promise<ActionResult> {
  const { target } = await requireTargetMember(slug, memberId);

  if (!input.open) {
    await prisma.staffAvailability.deleteMany({
      where: { storeMemberId: target.id, dayOfWeek: Number(input.dayOfWeek) },
    });
    revalidatePath(`/admin/${slug}/staff/${memberId}`);
    return { ok: true };
  }

  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (parsed.data.endMinute <= parsed.data.startMinute) {
    return { ok: false, error: "End time must be after start time" };
  }

  await prisma.staffAvailability.upsert({
    where: { storeMemberId_dayOfWeek: { storeMemberId: target.id, dayOfWeek: parsed.data.dayOfWeek } },
    update: { startMinute: parsed.data.startMinute, endMinute: parsed.data.endMinute },
    create: {
      storeMemberId: target.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startMinute: parsed.data.startMinute,
      endMinute: parsed.data.endMinute,
    },
  });

  revalidatePath(`/admin/${slug}/staff/${memberId}`);
  return { ok: true };
}

export async function adminAddExceptionAction(
  slug: string,
  memberId: string,
  input: ExceptionFormState,
): Promise<ActionResult> {
  const { target } = await requireTargetMember(slug, memberId);

  const parsed = availabilityExceptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.availabilityException.create({
    data: {
      storeMemberId: target.id,
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      type: parsed.data.type,
      recurringAnnually: parsed.data.recurringAnnually,
      label: parsed.data.label || null,
    },
  });

  revalidatePath(`/admin/${slug}/staff/${memberId}`);
  return { ok: true };
}

export async function adminUpdateExceptionAction(
  slug: string,
  memberId: string,
  exceptionId: string,
  input: ExceptionFormState,
): Promise<ActionResult> {
  const { target } = await requireTargetMember(slug, memberId);

  const parsed = availabilityExceptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const result = await prisma.availabilityException.updateMany({
    where: { id: exceptionId, storeMemberId: target.id },
    data: {
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      type: parsed.data.type,
      recurringAnnually: parsed.data.recurringAnnually,
      label: parsed.data.label || null,
    },
  });
  if (result.count === 0) return { ok: false, error: "Not found" };

  revalidatePath(`/admin/${slug}/staff/${memberId}`);
  return { ok: true };
}

export async function adminDeleteExceptionAction(
  slug: string,
  memberId: string,
  exceptionId: string,
): Promise<ActionResult> {
  const { target } = await requireTargetMember(slug, memberId);

  const result = await prisma.availabilityException.deleteMany({
    where: { id: exceptionId, storeMemberId: target.id },
  });
  if (result.count === 0) return { ok: false, error: "Not found" };

  revalidatePath(`/admin/${slug}/staff/${memberId}`);
  return { ok: true };
}
