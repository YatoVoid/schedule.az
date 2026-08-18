"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { storeOnboardingSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";

const LOGO_DIR = path.join(process.cwd(), "storage", "logos");
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function updateStoreAction(
  slug: string,
  input: {
    name: string;
    category: string;
    address: string;
    description: string;
    latitude: number | null;
    longitude: number | null;
  },
): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const parsed = storeOnboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.store.update({
    where: { id: membership.storeId },
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    },
  });

  revalidatePath(`/admin/${slug}`, "layout");
  return { ok: true };
}

export async function uploadStoreLogoAction(slug: string, formData: FormData): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received" };
  if (!ALLOWED_LOGO_TYPES.has(file.type)) return { ok: false, error: "Use a PNG, JPEG or WebP image" };
  if (file.size > MAX_LOGO_BYTES) return { ok: false, error: "Image must be under 5MB" };

  await mkdir(LOGO_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(LOGO_DIR, membership.storeId), bytes);

  await prisma.store.update({
    where: { id: membership.storeId },
    data: { logoMimeType: file.type, logoUpdatedAt: new Date() },
  });

  revalidatePath(`/admin/${slug}`, "layout");
  return { ok: true };
}
