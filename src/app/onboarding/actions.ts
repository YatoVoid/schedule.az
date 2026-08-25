"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateUniqueStoreSlug } from "@/lib/slug";
import { storeOnboardingSchema } from "@/lib/validation";
import { findDuplicateStoreName, DUPLICATE_NAME_WARNING } from "@/lib/duplicate-name";
import type { ActionResult } from "@/app/login/actions";

export async function createStoreAction(input: {
  name: string;
  category: string;
  address: string;
  phone: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}): Promise<ActionResult & { redirectTo?: string; warning?: string }> {
  const user = await requireUser();

  const parsed = storeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // One account can own more than one business — no check against existing
  // ADMIN memberships here. They end up ADMIN of this new store too,
  // keeping every existing membership (as ADMIN or STAFF) elsewhere intact.
  const slug = await generateUniqueStoreSlug(parsed.data.name);

  // Doesn't block creation — flags it only when neither fallback is set,
  // since an address or phone number already tells two same-named
  // businesses apart.
  const warning =
    !parsed.data.address && !parsed.data.phone && (await findDuplicateStoreName(parsed.data.name))
      ? DUPLICATE_NAME_WARNING
      : undefined;

  const store = await prisma.store.create({
    data: {
      slug,
      name: parsed.data.name,
      category: parsed.data.category,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      description: parsed.data.description || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      members: {
        create: { userId: user.id, role: "ADMIN" },
      },
    },
  });

  return { ok: true, redirectTo: `/admin/${store.slug}`, warning };
}
