"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { normalizePhone, isDevTestPhone } from "@/lib/phone";
import { staffInviteSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";

// No SMS invite link yet (SMS vendor not selected), the staff member simply
// logs into Schedule.az with the phone number the admin registers here, and
// lands on this store's staff dashboard automatically.
export async function inviteStaffAction(
  slug: string,
  rawPhone: string,
  role: "ADMIN" | "STAFF" = "STAFF",
): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  let phone: string | null;
  if (isDevTestPhone(rawPhone)) {
    phone = rawPhone.trim();
  } else {
    const parsed = staffInviteSchema.safeParse({ phone: rawPhone });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    phone = normalizePhone(parsed.data.phone);
    if (!phone) return { ok: false, error: "Enter a valid Azerbaijani phone number" };
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  const existing = await prisma.storeMember.findUnique({
    where: { storeId_userId: { storeId: membership.storeId, userId: user.id } },
  });
  if (existing) return { ok: false, error: "That number is already on your team" };

  await prisma.storeMember.create({
    data: { storeId: membership.storeId, userId: user.id, role },
  });

  revalidatePath(`/admin/${slug}/staff`);
  return { ok: true };
}

export async function removeStaffAction(slug: string, memberId: string): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  if (memberId === membership.id) {
    return { ok: false, error: "You can't remove yourself" };
  }

  const result = await prisma.storeMember.deleteMany({
    where: { id: memberId, storeId: membership.storeId },
  });
  if (result.count === 0) return { ok: false, error: "Team member not found" };

  revalidatePath(`/admin/${slug}/staff`);
  return { ok: true };
}
