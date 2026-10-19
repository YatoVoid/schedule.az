"use server";

import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { storeOnboardingSchema, googleReviewUrlSchema } from "@/lib/validation";
import { findDuplicateStoreName, DUPLICATE_NAME_WARNING } from "@/lib/duplicate-name";
import { matchesImageSignature } from "@/lib/image-sniff";
import { checkUploadedImage } from "@/lib/image-moderation";
import type { ActionResult } from "@/app/login/actions";

const LOGO_DIR = path.join(process.cwd(), "storage", "logos");
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const STORE_IMAGE_DIR = path.join(process.cwd(), "storage", "store-images");
const MAX_STORE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_STORE_IMAGES = 8;
const ALLOWED_STORE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function updateStoreAction(
  slug: string,
  input: {
    name: string;
    category: string;
    address: string;
    phone: string;
    description: string;
    latitude: number | null;
    longitude: number | null;
  },
): Promise<ActionResult & { warning?: string }> {
  const { membership } = await requireStoreAdmin(slug);

  const parsed = storeOnboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const warning =
    !parsed.data.address && !parsed.data.phone && (await findDuplicateStoreName(parsed.data.name, membership.storeId))
      ? DUPLICATE_NAME_WARNING
      : undefined;

  await prisma.store.update({
    where: { id: membership.storeId },
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      description: parsed.data.description || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    },
  });

  revalidatePath(`/admin/${slug}`, "layout");
  return { ok: true, warning };
}

export async function updateGoogleReviewUrlAction(slug: string, url: string): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const parsed = googleReviewUrlSchema.safeParse(url);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.store.update({
    where: { id: membership.storeId },
    data: { googleReviewUrl: parsed.data || null },
  });

  revalidatePath(`/${slug}`);
  return { ok: true };
}

export async function uploadStoreLogoAction(slug: string, formData: FormData): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received" };
  if (!ALLOWED_LOGO_TYPES.has(file.type)) return { ok: false, error: "Use a PNG, JPEG or WebP image" };
  if (file.size > MAX_LOGO_BYTES) return { ok: false, error: "Image must be under 5MB" };

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(file.type, bytes)) return { ok: false, error: "That file isn't a valid image" };
  const moderation = await checkUploadedImage(bytes, { storeId: membership.storeId, kind: "logo" });
  if (!moderation.ok) return moderation;

  await mkdir(LOGO_DIR, { recursive: true });
  await writeFile(path.join(LOGO_DIR, membership.storeId), bytes);

  await prisma.store.update({
    where: { id: membership.storeId },
    data: { logoMimeType: file.type, logoUpdatedAt: new Date() },
  });

  revalidatePath(`/admin/${slug}`, "layout");
  return { ok: true };
}

export async function uploadStoreImageAction(slug: string, formData: FormData): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received" };
  if (!ALLOWED_STORE_IMAGE_TYPES.has(file.type)) return { ok: false, error: "Use a PNG, JPEG or WebP image" };
  if (file.size > MAX_STORE_IMAGE_BYTES) return { ok: false, error: "Image must be under 8MB" };

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesImageSignature(file.type, bytes)) return { ok: false, error: "That file isn't a valid image" };
  const moderation = await checkUploadedImage(bytes, { storeId: membership.storeId, kind: "gallery" });
  if (!moderation.ok) return moderation;

  const count = await prisma.storeImage.count({ where: { storeId: membership.storeId } });
  if (count >= MAX_STORE_IMAGES) return { ok: false, error: `Up to ${MAX_STORE_IMAGES} photos per store` };

  const image = await prisma.storeImage.create({
    data: { storeId: membership.storeId, mimeType: file.type, position: count },
  });

  const dir = path.join(STORE_IMAGE_DIR, membership.storeId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, image.id), bytes);

  revalidatePath(`/admin/${slug}`, "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteStoreImageAction(slug: string, imageId: string): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const image = await prisma.storeImage.findFirst({
    where: { id: imageId, storeId: membership.storeId },
  });
  if (!image) return { ok: false, error: "Photo not found" };

  await prisma.storeImage.delete({ where: { id: image.id } });
  await rm(path.join(STORE_IMAGE_DIR, membership.storeId, image.id), { force: true });

  // Close the gap so position stays a dense 0..n-1 sequence.
  await prisma.storeImage.updateMany({
    where: { storeId: membership.storeId, position: { gt: image.position } },
    data: { position: { decrement: 1 } },
  });

  revalidatePath(`/admin/${slug}`, "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function reorderStoreImagesAction(slug: string, orderedIds: string[]): Promise<ActionResult> {
  const { membership } = await requireStoreAdmin(slug);

  const images = await prisma.storeImage.findMany({
    where: { storeId: membership.storeId },
    select: { id: true },
  });
  const known = new Set(images.map((i) => i.id));
  if (orderedIds.length !== images.length || !orderedIds.every((id) => known.has(id))) {
    return { ok: false, error: "Photo list is out of date, refresh and try again" };
  }

  await prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.storeImage.update({ where: { id }, data: { position } }),
    ),
  );

  revalidatePath(`/admin/${slug}`, "layout");
  revalidatePath("/");
  return { ok: true };
}
