import Link from "next/link";
import { StarIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyLink } from "@/components/copy-link";

const TOP_CUSTOMERS_LIMIT = 5;

export default async function AdminOverviewPage({
  params,
}: PageProps<"/admin/[slug]">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);
  const storeId = membership.storeId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const ACTIVE_STATUSES = ["PENDING_CONFIRMATION", "CONFIRMED"] as const;
  const KEPT_STATUSES = ["CONFIRMED", "COMPLETED"] as const;

  const [
    serviceCount,
    staffOnlyCount,
    allMembers,
    upcomingBookingCount,
    monthlyCompleted,
    allTimeKeptBookings,
    ratingAgg,
  ] = await Promise.all([
    prisma.service.count({ where: { storeId, active: true } }),
    prisma.storeMember.count({ where: { storeId, role: "STAFF" } }),
    prisma.storeMember.findMany({ where: { storeId }, include: { user: true } }),
    prisma.booking.count({ where: { storeId, status: { in: [...ACTIVE_STATUSES] }, startAt: { gte: now } } }),
    // Revenue is real charged amounts from completed jobs only, not
    // Service.priceAzn — a listed price isn't what was necessarily charged.
    prisma.booking.findMany({
      where: { storeId, status: "COMPLETED", startAt: { gte: startOfMonth, lt: startOfNextMonth } },
      select: { priceAzn: true, storeMemberId: true },
    }),
    // Repeat-customer behavior looks at anything actually kept (confirmed or
    // completed), not cancelled/declined requests that never happened.
    prisma.booking.findMany({
      where: { storeId, status: { in: [...KEPT_STATUSES] } },
      select: { userId: true, user: { select: { name: true, phone: true, email: true } } },
    }),
    prisma.review.aggregate({ where: { storeId }, _avg: { rating: true }, _count: { rating: true } }),
  ]);

  const revenueThisMonth = monthlyCompleted.reduce((sum, b) => sum + (b.priceAzn?.toNumber() ?? 0), 0);

  const perStaffThisMonth = new Map<string, { count: number; revenue: number }>();
  for (const b of monthlyCompleted) {
    const entry = perStaffThisMonth.get(b.storeMemberId) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += b.priceAzn?.toNumber() ?? 0;
    perStaffThisMonth.set(b.storeMemberId, entry);
  }
  // Every team member is listed, even at 0 for the month, so "which staff
  // did how many bookings" is always answerable, not just for whoever
  // happened to have activity.
  const staffLeaderboard = allMembers
    .map((m) => ({
      name: m.user.name ?? m.user.phone ?? "Team member",
      count: perStaffThisMonth.get(m.id)?.count ?? 0,
      revenue: perStaffThisMonth.get(m.id)?.revenue ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const customerStats = new Map<string, { name: string; count: number }>();
  for (const b of allTimeKeptBookings) {
    const name = b.user.name ?? b.user.phone ?? b.user.email ?? "Customer";
    const entry = customerStats.get(b.userId) ?? { name, count: 0 };
    entry.count += 1;
    customerStats.set(b.userId, entry);
  }
  const totalCustomers = customerStats.size;
  const repeatCustomerList = [...customerStats.values()]
    .filter((c) => c.count > 1)
    .sort((a, b) => b.count - a.count);
  const rebookRate = totalCustomers > 0 ? Math.round((repeatCustomerList.length / totalCustomers) * 100) : null;

  const setupDone = serviceCount > 0 && staffOnlyCount > 0 && !!membership.store.address;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Your public booking page</p>
        <CopyLink path={`/${slug}`} />
        <p className="text-xs text-muted-foreground">Share this on Instagram or wherever your customers find you.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active services" value={serviceCount} href={`/admin/${slug}/services`} />
        <StatCard label="Team" value={allMembers.length} href={`/admin/${slug}/staff`} />
        <StatCard label="Upcoming bookings" value={upcomingBookingCount} href={`/admin/${slug}/bookings`} />
        <Link
          href={`/admin/${slug}/reviews`}
          className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
        >
          {ratingAgg._count.rating > 0 ? (
            <div className="flex items-center gap-1">
              <StarIcon className="size-4 text-primary" fill="currentColor" />
              <p className="text-2xl font-medium font-mono tabular-nums">{ratingAgg._avg.rating!.toFixed(1)}</p>
            </div>
          ) : (
            <p className="text-2xl font-medium font-mono tabular-nums">—</p>
          )}
          <p className="text-xs text-muted-foreground">
            {ratingAgg._count.rating > 0 ? `${ratingAgg._count.rating} rating${ratingAgg._count.rating === 1 ? "" : "s"}` : "Rating"}
          </p>
        </Link>
      </div>

      {!setupDone && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Get set up</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ChecklistRow done={serviceCount > 0} label="Add at least one service" href={`/admin/${slug}/services`} />
            <ChecklistRow done={staffOnlyCount > 0} label="Invite a staff member" href={`/admin/${slug}/staff`} />
            <ChecklistRow
              done={!!membership.store.address}
              label="Add your address and description"
              href={`/admin/${slug}/settings`}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This month</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-medium font-mono tabular-nums">{monthlyCompleted.length}</p>
              <p className="text-xs text-muted-foreground">Completed bookings</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-2xl font-medium font-mono tabular-nums">{revenueThisMonth.toFixed(0)} AZN</p>
              <p className="text-xs text-muted-foreground">Revenue charged</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Staff this month</p>
            {staffLeaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {staffLeaderboard.map((s, i) => (
                  <div
                    key={s.name + i}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium">{s.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {s.count} booking{s.count === 1 ? "" : "s"} · {s.revenue.toFixed(0)} AZN
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Repeat customers</p>
            {totalCustomers === 0 ? (
              <p className="text-sm text-muted-foreground">No customers yet.</p>
            ) : (
              <>
                <p className="mb-2 text-sm text-muted-foreground">
                  {repeatCustomerList.length} of {totalCustomers} customers have booked more than once ({rebookRate}%)
                </p>
                {repeatCustomerList.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {repeatCustomerList.slice(0, TOP_CUSTOMERS_LIMIT).map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium">{c.name}</span>
                        <span className="shrink-0 text-muted-foreground">{c.count} bookings</span>
                      </div>
                    ))}
                    {repeatCustomerList.length > TOP_CUSTOMERS_LIMIT && (
                      <p className="text-xs text-muted-foreground">
                        +{repeatCustomerList.length - TOP_CUSTOMERS_LIMIT} more repeat customer
                        {repeatCustomerList.length - TOP_CUSTOMERS_LIMIT === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent">
      <p className="text-2xl font-medium font-mono tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}

function ChecklistRow({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
            done ? "bg-primary text-primary-foreground" : "border border-muted-foreground/40"
          }`}
        >
          {done ? "✓" : ""}
        </span>
        <span className={done ? "text-muted-foreground line-through" : ""}>{label}</span>
      </div>
      {!done && (
        <Button render={<Link href={href} />} nativeButton={false} variant="outline" size="sm">
          Go
        </Button>
      )}
    </div>
  );
}
