"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { chargedPriceSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";

// Admin-scoped: can accept/decline ANY staff member's pending booking,
// mirroring respondToBookingAction in app/staff/[slug]/actions.ts.
export async function adminRespondToBookingAction(
  slug: string,
  bookingId: string,
  status: "CONFIRMED" | "DECLINED",
  note: string,
): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const result = await prisma.booking.updateMany({
    where: { id: bookingId, storeId: membership.storeId, status: "PENDING_CONFIRMATION" },
    data: { status, note: note.trim() || undefined, clientSeenStatusAt: null },
  });
  if (result.count === 0) return { ok: false, error: "Booking not found or already handled" };

  revalidatePath(`/admin/${slug}/bookings`);
  return { ok: true };
}

// Admin-scoped: can mark ANY staff member's confirmed booking as complete,
// mirroring completeBookingAction in app/staff/[slug]/actions.ts which is
// scoped to the caller's own bookings only.
export async function adminCompleteBookingAction(
  slug: string,
  bookingId: string,
  chargedPrice: string,
): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const parsed = chargedPriceSchema.safeParse(chargedPrice);
  if (!parsed.success) return { ok: false, error: "Enter a valid amount" };

  const result = await prisma.booking.updateMany({
    where: { id: bookingId, storeId: membership.storeId, status: "CONFIRMED" },
    data: { status: "COMPLETED", priceAzn: parsed.data },
  });
  if (result.count === 0) return { ok: false, error: "Booking not found or not confirmed yet" };

  revalidatePath(`/admin/${slug}/bookings`);
  return { ok: true };
}
