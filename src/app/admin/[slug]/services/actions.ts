"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { serviceSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";

export async function createServiceAction(
  slug: string,
  input: { name: string; durationMin: string; priceAzn: string },
): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.service.create({
    data: {
      storeId: membership.storeId,
      name: parsed.data.name,
      durationMin: parsed.data.durationMin,
      priceAzn: parsed.data.priceAzn,
    },
  });

  revalidatePath(`/admin/${slug}/services`);
  return { ok: true };
}

export async function toggleServiceAction(slug: string, serviceId: string): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const service = await prisma.service.findFirst({
    where: { id: serviceId, storeId: membership.storeId },
  });
  if (!service) return { ok: false, error: "Service not found" };

  await prisma.service.update({ where: { id: service.id }, data: { active: !service.active } });
  revalidatePath(`/admin/${slug}/services`);
  return { ok: true };
}

export async function deleteServiceAction(slug: string, serviceId: string): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const result = await prisma.service.deleteMany({
    where: { id: serviceId, storeId: membership.storeId },
  });
  if (result.count === 0) return { ok: false, error: "Service not found" };

  revalidatePath(`/admin/${slug}/services`);
  return { ok: true };
}
