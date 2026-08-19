"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateUniqueStoreSlug } from "@/lib/slug";
import { storeOnboardingSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";

export async function createStoreAction(input: {
  name: string;
  category: string;
  address: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}): Promise<ActionResult & { redirectTo?: string }> {
  const user = await requireUser();

  const parsed = storeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // Only blocks someone who already owns a business — staff-only members
  // (and plain consumers) are allowed through, so a person who works
  // somewhere can still start their own; they end up an ADMIN of the new
  // store and keep their existing STAFF membership elsewhere.
  const existingAdmin = await prisma.storeMember.findFirst({ where: { userId: user.id, role: "ADMIN" } });
  if (existingAdmin) redirect("/onboarding");

  const slug = await generateUniqueStoreSlug(parsed.data.name);

  const store = await prisma.store.create({
    data: {
      slug,
      name: parsed.data.name,
      category: parsed.data.category,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      members: {
        create: { userId: user.id, role: "ADMIN" },
      },
    },
  });

  return { ok: true, redirectTo: `/admin/${store.slug}` };
}
