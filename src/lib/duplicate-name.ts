import { prisma } from "@/lib/prisma";

// Case/whitespace-insensitive collision check, used at both creation and
// rename time. Doesn't block the save — a legitimate business can share a
// name with an unrelated one (common enough with generic names) — it just
// nudges the owner toward adding a real address or phone number, since
// those are the two fields that actually tell two same-named listings
// apart in the directory (src/components/store-panel.tsx's fallback
// cascade: address, then phone, then the store's own unique slug).
export async function findDuplicateStoreName(name: string, excludeStoreId?: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const match = await prisma.store.findFirst({
    where: {
      name: { equals: trimmed, mode: "insensitive" },
      ...(excludeStoreId ? { id: { not: excludeStoreId } } : {}),
    },
    select: { id: true },
  });
  return !!match;
}

export const DUPLICATE_NAME_WARNING =
  "Another business on Schedule.az already uses this name. Add your address or phone number so customers can tell you apart.";
