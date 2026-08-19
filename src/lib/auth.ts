import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

// A user can be ADMIN at one store and STAFF at another, so "which store" is
// resolved by slug, not assumed from the user alone.
export async function requireStoreMember(storeSlug: string) {
  const user = await requireUser();
  const membership = await prisma.storeMember.findFirst({
    where: { userId: user.id, store: { slug: storeSlug } },
    include: { store: true },
  });
  if (!membership) redirect("/onboarding");
  return { user, membership };
}

export async function requireStoreAdmin(storeSlug: string) {
  const { user, membership } = await requireStoreMember(storeSlug);
  if (membership.role !== "ADMIN") redirect(`/staff/${storeSlug}`);
  return { user, membership };
}

export type UserMembership = {
  storeSlug: string;
  storeName: string;
  role: "ADMIN" | "STAFF";
  href: string;
};

// A phone number that has ever created or joined a store stays a
// business-connected account for that store, indefinitely: this is a live
// lookup by userId, not a cached flag, so it can never drift from the
// StoreMember rows that are the actual source of truth. Returns every store
// the user belongs to — someone can be STAFF at one shop and ADMIN of their
// own elsewhere, and the nav needs to offer all of them, not just the first
// one found. Used to surface a dashboard link/switcher on customer-facing
// pages and inside each dashboard, so an owner/staff account never looks
// like it "lost" its business side just because they're viewing the site as
// a customer, and never gets stuck only seeing one of several affiliations.
export async function getUserMemberships(userId: string): Promise<UserMembership[]> {
  const memberships = await prisma.storeMember.findMany({
    where: { userId },
    include: { store: true },
    orderBy: { store: { name: "asc" } },
  });
  return memberships.map((m) => ({
    storeSlug: m.store.slug,
    storeName: m.store.name,
    role: m.role,
    href: m.role === "ADMIN" ? `/admin/${m.store.slug}` : `/staff/${m.store.slug}`,
  }));
}
