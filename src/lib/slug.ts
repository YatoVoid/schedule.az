import { prisma } from "@/lib/prisma";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[əğıöşüç]/g, (ch) =>
      ({ ə: "e", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", ç: "c" })[ch] ?? ch,
    )
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueStoreSlug(name: string) {
  const base = slugify(name) || "store";
  let slug = base;
  let suffix = 1;
  while (await prisma.store.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}
