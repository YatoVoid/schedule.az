import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, getUserMemberships } from "@/lib/auth";
import { userAvatarUrl } from "@/lib/avatar";
import { SiteHeader } from "@/components/site-header";
import { AccountTabs } from "./account-tabs";
import type { AccountBooking } from "./booking-row";

export default async function AccountPage({
  searchParams,
}: PageProps<"/account">) {
  const { tab } = await searchParams;
  const initialTab = tab === "favorites" || tab === "past" || tab === "profile" ? tab : "upcoming";

  const user = await requireUser("/account");
  const memberships = await getUserMemberships(user.id);

  const [upcoming, past, favorites] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } },
      include: { store: true, service: true, storeMember: { include: { user: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { userId: user.id, NOT: { status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } } },
      include: { store: true, service: true, storeMember: { include: { user: true } } },
      orderBy: { startAt: "desc" },
      take: 20,
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { store: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  function toRow(b: (typeof upcoming)[number]): AccountBooking {
    return {
      id: b.id,
      storeName: b.store.name,
      storeSlug: b.store.slug,
      storeAddress: b.store.address,
      serviceName: b.service.name,
      staffName: b.storeMember.user.name ?? b.storeMember.user.phone ?? "Staff",
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      status: b.status,
      note: b.note,
      unseen: b.clientSeenStatusAt === null && (b.status === "CONFIRMED" || b.status === "DECLINED"),
    };
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <SiteHeader loggedIn showAccountLink={false} memberships={memberships} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
            ← All businesses
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-medium tracking-tight">My account</h1>
        </div>

        <AccountTabs
          initialTab={initialTab}
          upcoming={upcoming.map(toRow)}
          past={past.map(toRow)}
          favorites={favorites.map((f) => ({
            storeId: f.store.id,
            slug: f.store.slug,
            name: f.store.name,
            category: f.store.category,
            logoUpdatedAt: f.store.logoUpdatedAt ? f.store.logoUpdatedAt.toISOString() : null,
          }))}
          profile={{
            identifier: user.phone ?? user.email ?? "",
            name: user.name,
            username: user.username,
            avatarUrl: userAvatarUrl(user.id, user.avatarUpdatedAt),
            fallbackInitial: (user.phone ?? user.email ?? "?").slice(0, 1).toUpperCase(),
            memberships,
          }}
        />
      </main>
    </div>
  );
}
