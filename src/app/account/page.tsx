import { prisma } from "@/lib/prisma";
import { requireUser, getUserMemberships } from "@/lib/auth";
import { userAvatarUrl } from "@/lib/avatar";
import { SiteHeader } from "@/components/site-header";
import { AccountTabs } from "./account-tabs";
import type { AccountBooking } from "./booking-row";

function initials(name: string | null, fallback: string): string {
  if (!name) return fallback.slice(0, 1).toUpperCase();
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default async function AccountPage({
  searchParams,
}: PageProps<"/account">) {
  const { tab } = await searchParams;
  const initialTab = tab === "favorites" || tab === "past" || tab === "profile" ? tab : "upcoming";

  const user = await requireUser("/account");
  const memberships = await getUserMemberships(user.id);

  const [upcoming, past, favorites, attendedCount] = await Promise.all([
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
    prisma.booking.count({ where: { userId: user.id, status: "COMPLETED" } }),
  ]);

  const avatarUrl = userAvatarUrl(user.id, user.avatarUpdatedAt);

  function toRow(b: (typeof upcoming)[number]): AccountBooking {
    return {
      id: b.id,
      storeName: b.store.name,
      storeSlug: b.store.slug,
      storeAddress: b.store.address,
      storeCategory: b.store.category,
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader loggedIn userName={user.name} memberships={memberships} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:py-14">
        <div className="flex items-center gap-5">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-lg font-semibold text-primary-foreground sm:size-18">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials(user.name, user.phone ?? user.email ?? "?")
            )}
          </div>
          <div className="min-w-0">
            <p className="eyebrow text-muted-foreground">Your space</p>
            <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              Good to see you{user.name ? "," : "."}
            </h1>
            {user.name && (
              <p className="truncate font-serif text-3xl leading-tight text-blossom-ink italic sm:text-4xl">
                {user.name.split(" ")[0]}
              </p>
            )}
          </div>
        </div>

        <AccountTabs
          initialTab={initialTab}
          attendedCount={attendedCount}
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
            avatarUrl,
            fallbackInitial: (user.phone ?? user.email ?? "?").slice(0, 1).toUpperCase(),
            memberships,
          }}
        />
      </main>
    </div>
  );
}
