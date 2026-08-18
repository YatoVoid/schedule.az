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

  const existing = await prisma.storeMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/onboarding");

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
