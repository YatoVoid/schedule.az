import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AZT_OFFSET_MS } from "@/lib/baku-time";
import { pickChannel } from "@/lib/reminders/channel";
import { appointmentSendAt, winbackSendAt } from "@/lib/reminders/schedule-time";
import { resolveReturnIntervalDays, MAX_RETURN_INTERVAL_DAYS } from "@/lib/return-cadence";
import { MAX_SEND_DELAY_MS } from "@/lib/reminders/config";

const DAY_MS = 24 * 60 * 60 * 1000;

// Two cycles racing (the loop plus the HTTP trigger) can both try to create
// the same dedupeKey; the unique index makes the loser a no-op rather than
// an error.
async function createReminder(data: Prisma.ScheduledReminderUncheckedCreateInput): Promise<boolean> {
  try {
    await prisma.scheduledReminder.create({ data });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
    throw err;
  }
}

// Booking.startAt / endAt digits are Baku wall time in a UTC-labeled Date,
// so anything compared against them has to be Baku-labeled too.
function bakuLabeledNow(now: Date): Date {
  return new Date(now.getTime() + AZT_OFFSET_MS);
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

// Re-derives the reminder rows that should exist from current Booking state.
// Safe to run repeatedly; every branch is an upsert-shaped no-op when
// nothing changed.
export async function planReminders(now: Date = new Date()): Promise<{ appointments: number; winbacks: number }> {
  const appointments = await planAppointmentReminders(now);
  const winbacks = await planWinbackReminders(now);
  return { appointments, winbacks };
}

async function planAppointmentReminders(now: Date): Promise<number> {
  const horizon = bakuLabeledNow(now);
  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", startAt: { gt: horizon } },
    select: {
      id: true,
      userId: true,
      storeId: true,
      startAt: true,
      user: { select: { phone: true, email: true } },
    },
  });

  const keys = bookings.map((b) => `appt:${b.id}`);
  const existing = keys.length
    ? await prisma.scheduledReminder.findMany({ where: { dedupeKey: { in: keys } } })
    : [];
  const byKey = new Map(existing.map((r) => [r.dedupeKey, r]));

  let touched = 0;
  for (const b of bookings) {
    const key = `appt:${b.id}`;
    const channel = pickChannel(b.user);
    const sendAt = appointmentSendAt(b.startAt);
    const row = byKey.get(key);

    if (!row) {
      if (
        await createReminder({
          kind: "APPOINTMENT",
          channel: channel ?? "EMAIL",
          status: channel ? "PENDING" : "SKIPPED",
          lastError: channel ? null : "no contact channel",
          dedupeKey: key,
          userId: b.userId,
          storeId: b.storeId,
          bookingId: b.id,
          sendAt,
          sourceAt: b.startAt,
        })
      ) {
        touched++;
      }
      continue;
    }

    const moved = row.sourceAt.getTime() !== b.startAt.getTime();

    if (row.status === "PENDING" || row.status === "SKIPPED") {
      const data: Prisma.ScheduledReminderUpdateInput = {};
      if (moved) {
        data.sendAt = sendAt;
        data.sourceAt = b.startAt;
      }
      if (channel && row.channel !== channel) data.channel = channel;
      if (channel && row.status === "SKIPPED") {
        data.status = "PENDING";
        data.lastError = null;
      }
      if (!channel && row.status === "PENDING") {
        data.status = "SKIPPED";
        data.lastError = "no contact channel";
      }
      if (Object.keys(data).length) {
        await prisma.scheduledReminder.update({ where: { id: row.id }, data });
        touched++;
      }
    } else if (moved && !sameCalendarDay(row.sourceAt, b.startAt)) {
      // Rescheduled to a different day after the first reminder was already
      // sent (or failed): arm a fresh one for the new day.
      await prisma.scheduledReminder.update({
        where: { id: row.id },
        data: {
          status: channel ? "PENDING" : "SKIPPED",
          lastError: channel ? null : "no contact channel",
          channel: channel ?? row.channel,
          sendAt,
          sourceAt: b.startAt,
          attempts: 0,
          sentAt: null,
        },
      });
      touched++;
    }
  }

  touched += await cancelRemindersForDroppedBookings();
  return touched;
}

async function cancelRemindersForDroppedBookings(): Promise<number> {
  const open = await prisma.scheduledReminder.findMany({
    where: { kind: "APPOINTMENT", status: { in: ["PENDING", "SKIPPED"] } },
    select: { id: true, bookingId: true },
  });
  const bookingIds = open.map((r) => r.bookingId).filter((v): v is string => !!v);
  if (!bookingIds.length) return 0;

  const statusById = new Map(
    (
      await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: { id: true, status: true },
      })
    ).map((b) => [b.id, b.status]),
  );

  const staleIds = open
    .filter((r) => {
      const status = r.bookingId ? statusById.get(r.bookingId) : undefined;
      return !status || status === "CANCELLED" || status === "DECLINED";
    })
    .map((r) => r.id);

  if (!staleIds.length) return 0;
  await prisma.scheduledReminder.updateMany({
    where: { id: { in: staleIds } },
    data: { status: "CANCELLED", lastError: "booking no longer active" },
  });
  return staleIds.length;
}

async function planWinbackReminders(now: Date): Promise<number> {
  // A completed visit older than the longest return interval (plus slack)
  // can only produce a win-back that is already far past its send window,
  // so it never needs planning again. This keeps the scan bounded forever.
  const lookbackCutoff = new Date(
    now.getTime() + AZT_OFFSET_MS - (MAX_RETURN_INTERVAL_DAYS + 45) * DAY_MS,
  );

  const groups = await prisma.booking.groupBy({
    by: ["userId", "storeId"],
    where: { status: "COMPLETED", endAt: { gte: lookbackCutoff } },
    _max: { endAt: true },
  });
  if (!groups.length) return 0;

  const userIds = [...new Set(groups.map((g) => g.userId))];
  const storeIds = [...new Set(groups.map((g) => g.storeId))];
  const keys = groups.map((g) => `winback:${g.userId}:${g.storeId}`);

  const [users, stores, existing] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, phone: true, email: true, winbackOptOut: true },
    }),
    prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, category: true } }),
    prisma.scheduledReminder.findMany({ where: { dedupeKey: { in: keys } } }),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const byKey = new Map(existing.map((r) => [r.dedupeKey, r]));

  const staleBefore = now.getTime() - MAX_SEND_DELAY_MS;

  let touched = 0;
  for (const g of groups) {
    const lastVisit = g._max.endAt;
    const user = userById.get(g.userId);
    const store = storeById.get(g.storeId);
    if (!lastVisit || !user || !store) continue;

    const channel = pickChannel(user);
    const interval = resolveReturnIntervalDays(store.category);
    const sendAt = winbackSendAt(lastVisit, interval);
    const key = `winback:${g.userId}:${g.storeId}`;
    const row = byKey.get(key);

    const blocked = !channel
      ? "no contact channel"
      : user.winbackOptOut
        ? "opted out"
        : sendAt.getTime() < staleBefore
          ? "overdue at planning"
          : null;
    const status = blocked ? "SKIPPED" : "PENDING";

    if (!row) {
      if (
        await createReminder({
          kind: "WINBACK",
          channel: channel ?? "EMAIL",
          status,
          lastError: blocked,
          dedupeKey: key,
          userId: g.userId,
          storeId: g.storeId,
          sendAt,
          sourceAt: lastVisit,
        })
      ) {
        touched++;
      }
      continue;
    }

    if (row.sourceAt.getTime() < lastVisit.getTime()) {
      // A newer completed visit: re-arm the single outstanding win-back.
      await prisma.scheduledReminder.update({
        where: { id: row.id },
        data: {
          status,
          lastError: blocked,
          channel: channel ?? row.channel,
          sendAt,
          sourceAt: lastVisit,
          attempts: 0,
          sentAt: null,
        },
      });
      touched++;
    } else if (row.status === "PENDING" || row.status === "SKIPPED") {
      // Same source visit: keep timing and eligibility current, but never
      // resurrect a SENT row without a new visit — that is the "one nudge,
      // then quiet" rule.
      const data: Prisma.ScheduledReminderUpdateInput = {};
      if (row.sendAt.getTime() !== sendAt.getTime()) data.sendAt = sendAt;
      if (channel && row.channel !== channel) data.channel = channel;
      if (row.status !== status) {
        data.status = status;
        data.lastError = blocked;
      } else if (row.lastError !== blocked) {
        data.lastError = blocked;
      }
      if (Object.keys(data).length) {
        await prisma.scheduledReminder.update({ where: { id: row.id }, data });
        touched++;
      }
    }
  }
  return touched;
}
