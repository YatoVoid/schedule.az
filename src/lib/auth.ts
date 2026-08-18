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
