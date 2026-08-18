import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { AdminBookingRow, type AdminBookingRow as Row } from "./booking-row";

const PAST_LIMIT = 15;

export default async function AdminBookingsPage({
  params,
}: PageProps<"/admin/[slug]/bookings">) {
  const { slug } = await params;
  const { membership } = await requireStoreAdmin(slug);
  const now = new Date();

  const [pending, confirmed, past, pastTotal] = await Promise.all([
    prisma.booking.findMany({
      where: { storeId: membership.storeId, status: "PENDING_CONFIRMATION" },
      include: { service: true, user: true, storeMember: { include: { user: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { storeId: membership.storeId, status: "CONFIRMED" },
      include: { service: true, user: true, storeMember: { include: { user: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { storeId: membership.storeId, status: { in: ["COMPLETED", "CANCELLED", "DECLINED"] } },
      include: { service: true, user: true, storeMember: { include: { user: true } } },
      orderBy: { startAt: "desc" },
      take: PAST_LIMIT,
    }),
    prisma.booking.count({
      where: { storeId: membership.storeId, status: { in: ["COMPLETED", "CANCELLED", "DECLINED"] } },
    }),
  ]);

  const upcoming = confirmed.filter((b) => b.startAt >= now);
  const overdue = confirmed.filter((b) => b.startAt < now);

  function toRow(b: (typeof pending)[number]): Row {
    return {
      id: b.id,
      serviceName: b.service.name,
      customerName: b.user.name ?? b.user.phone ?? b.user.email ?? "Customer",
      staffName: b.storeMember.user.name ?? b.storeMember.user.phone ?? "Staff",
      startAt: b.startAt.toISOString(),
      status: b.status,
      rescheduledAt: b.rescheduledAt ? b.rescheduledAt.toISOString() : null,
      priceAzn: b.priceAzn ? b.priceAzn.toString() : null,
      note: b.note,
    };
  }

  const hasAnything = pending.length + upcoming.length + overdue.length + past.length > 0;

  if (!hasAnything) {
    return (
      <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No bookings yet. Once your public page is shared and someone books, requests will show up here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <Section title={`Needs a response (${pending.length})`}>
          {pending.map((b) => (
            <AdminBookingRow key={b.id} slug={slug} booking={toRow(b)} showActions="respond" />
          ))}
        </Section>
      )}

      {overdue.length > 0 && (
        <Section title={`Needs completion (${overdue.length})`} hint="These already happened but were never marked done.">
          {overdue.map((b) => (
            <AdminBookingRow key={b.id} slug={slug} booking={toRow(b)} showActions="complete" />
          ))}
        </Section>
      )}

      <Section title={`Upcoming (${upcoming.length})`}>
        {upcoming.length === 0 ? (
          <Empty>No upcoming confirmed bookings.</Empty>
        ) : (
          upcoming.map((b) => <AdminBookingRow key={b.id} slug={slug} booking={toRow(b)} showActions="complete" />)
        )}
      </Section>

      <Section title={`Past${pastTotal > PAST_LIMIT ? ` (last ${PAST_LIMIT} of ${pastTotal})` : ` (${pastTotal})`}`}>
        {past.length === 0 ? (
          <Empty>No past bookings yet.</Empty>
        ) : (
          past.map((b) => <AdminBookingRow key={b.id} slug={slug} booking={toRow(b)} showActions="none" />)
        )}
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">{children}</p>;
}
