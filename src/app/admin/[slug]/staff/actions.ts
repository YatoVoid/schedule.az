"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { normalizePhone, isDevTestPhone } from "@/lib/phone";
import { requestOtp, verifyOtp, OtpRateLimitError } from "@/lib/otp";
import { staffInviteSchema, otpCodeSchema } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/security-log";
import type { ActionResult } from "@/app/login/actions";

function resolveStaffPhone(rawPhone: string): { phone: string } | { error: string } {
  if (isDevTestPhone(rawPhone)) return { phone: rawPhone.trim() };
  const parsed = staffInviteSchema.safeParse({ phone: rawPhone });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "Enter a valid Azerbaijani phone number" };
  return { phone };
}

// Step 1: send a verification code to the phone the admin wants to add.
// This is the same OTP machinery as login (src/lib/otp.ts): it also
// creates the User row for a brand-new phone, so step 2 can look it up.
// The admin never adds a phone number to their team without whoever holds
// that phone actually reading the code back to them first.
export async function sendStaffInviteCodeAction(slug: string, rawPhone: string): Promise<ActionResult> {
  await requireStoreAdmin(slug);

  const resolved = resolveStaffPhone(rawPhone);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  if (isDevTestPhone(resolved.phone)) {
    // Dev bypass: no real code to send, step 2 accepts "0000" directly,
    // same convention as the login dev bypass. Still upsert the user here
    // so step 2's verifyOtp lookup has someone to find.
    await prisma.user.upsert({ where: { phone: resolved.phone }, update: {}, create: { phone: resolved.phone } });
    return { ok: true };
  }

  try {
    await requestOtp({ type: "phone", value: resolved.phone });
    return { ok: true };
  } catch (err) {
    if (err instanceof OtpRateLimitError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Couldn't send a code. Try again." };
  }
}

// Step 2: the admin enters the code back (read off the new team member's
// phone), which is what actually creates the membership.
export async function confirmStaffInviteAction(
  slug: string,
  rawPhone: string,
  rawCode: string,
  role: "ADMIN" | "STAFF" = "STAFF",
): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const resolved = resolveStaffPhone(rawPhone);
  if ("error" in resolved) return { ok: false, error: resolved.error };

  let userId: string;
  if (isDevTestPhone(resolved.phone)) {
    if (rawCode.trim() !== "0000") return { ok: false, error: "Incorrect or expired code" };
    const user = await prisma.user.upsert({ where: { phone: resolved.phone }, update: {}, create: { phone: resolved.phone } });
    userId = user.id;
  } else {
    const codeParsed = otpCodeSchema.safeParse(rawCode);
    if (!codeParsed.success) return { ok: false, error: codeParsed.error.issues[0].message };
    const user = await verifyOtp({ type: "phone", value: resolved.phone }, codeParsed.data);
    if (!user) return { ok: false, error: "Incorrect or expired code" };
    userId = user.id;
  }

  const existing = await prisma.storeMember.findUnique({
    where: { storeId_userId: { storeId: membership.storeId, userId } },
  });
  if (existing) return { ok: false, error: "That number is already on your team" };

  await prisma.storeMember.create({
    data: { storeId: membership.storeId, userId, role },
  });
  await logSecurityEvent("STAFF_ADDED", { userId: membership.userId, storeId: membership.storeId, detail: `added ${userId} as ${role}` });

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
  await logSecurityEvent("STAFF_REMOVED", { userId: membership.userId, storeId: membership.storeId, detail: `removed member ${memberId}` });

  revalidatePath(`/admin/${slug}/staff`);
  return { ok: true };
}
