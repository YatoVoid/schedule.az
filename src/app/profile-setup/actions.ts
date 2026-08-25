"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";
import type { ActionResult } from "@/app/login/actions";

const AVATAR_DIR = path.join(process.cwd(), "storage", "avatars");
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function checkUsernameAvailableAction(
  raw: string,
): Promise<{ ok: true; available: boolean } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.user.findUnique({ where: { username: parsed.data } });
  return { ok: true, available: !existing || existing.id === user.id };
}

export async function saveUsernameAction(raw: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.user.findUnique({ where: { username: parsed.data } });
  if (existing && existing.id !== user.id) return { ok: false, error: "That username is taken" };

  await prisma.user.update({ where: { id: user.id }, data: { username: parsed.data } });
  revalidatePath("/account");
  return { ok: true };
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received" };
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) return { ok: false, error: "Use a PNG, JPEG or WebP image" };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, error: "Image must be under 5MB" };

  await mkdir(AVATAR_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(AVATAR_DIR, user.id), bytes);

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarMimeType: file.type, avatarUpdatedAt: new Date() },
  });

  revalidatePath("/account");
  return { ok: true };
}
