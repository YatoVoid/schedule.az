import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AZT_OFFSET_MS } from "@/lib/baku-time";
import { smsProvider } from "@/lib/sms";
import { emailProvider } from "@/lib/email";
import { reserveSend, SendBudgetError } from "@/lib/send-budget";
import { pickChannel } from "@/lib/reminders/channel";
import { renderReminder, type ReminderContext } from "@/lib/reminders/messages";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import {
  MAX_ATTEMPTS,
  MAX_MESSAGES_PER_USER_PER_DAY,
  MAX_SEND_DELAY_MS,
  MAX_SENDS_PER_RUN,
  WINBACK_MAX_PER_USER_PER_WINDOW,
  WINBACK_PER_USER_WINDOW_DAYS,
} from "@/lib/reminders/config";

const DAY_MS = 24 * 60 * 60 * 1000;
const STUCK_AFTER_MS = 10 * 60 * 1000;
const SEND_CONCURRENCY = 5;

export type SendSummary = {
  claimed: number;
  sent: number;
  skipped: number;
  failed: number;
  deferred: number;
  cancelled: number;
};

export async function runDueReminders(now: Date = new Date()): Promise<SendSummary> {
  await requeueStuck(now);

  const claimed = await claimDue(now, MAX_SENDS_PER_RUN);
  const summary: SendSummary = {
    claimed: claimed.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    deferred: 0,
    cancelled: 0,
  };
  if (!claimed.length) return summary;

  const rows = await prisma.scheduledReminder.findMany({
    where: { id: { in: claimed.map((c) => c.id) } },
    ...reminderQuery,
  });

  await mapWithConcurrency(rows, SEND_CONCURRENCY, async (row) => {
    const outcome = await processReminder(row, now).catch(async (err) => {
      // An unexpected error in our own logic (not the provider) — park the
      // row so it can't be reclaimed in a hot loop.
      const message = err instanceof Error ? err.message : String(err);
      await prisma.scheduledReminder.update({
        where: { id: row.id },
        data: { status: "FAILED", lastError: `pipeline: ${message}` },
      });
      return "failed" as const;
    });
    summary[outcome] += 1;
  });

  return summary;
}

type Outcome = "sent" | "skipped" | "failed" | "deferred" | "cancelled";

const reminderQuery = {
  include: {
    user: { select: { id: true, name: true, phone: true, email: true, winbackOptOut: true } },
    store: {
      select: {
        name: true,
        slug: true,
        description: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    },
    booking: {
      select: {
        status: true,
        startAt: true,
        storeMember: { select: { user: { select: { name: true } } } },
      },
    },
  },
} satisfies Prisma.ScheduledReminderDefaultArgs;

type ReminderRow = Prisma.ScheduledReminderGetPayload<typeof reminderQuery>;

async function processReminder(row: ReminderRow, now: Date): Promise<Outcome> {
  const channel = pickChannel(row.user);
  if (!channel) return finalize(row.id, "SKIPPED", "no contact channel", "skipped");

  if (now.getTime() - row.sendAt.getTime() > MAX_SEND_DELAY_MS) {
    return finalize(row.id, "SKIPPED", "past send window", "skipped");
  }

  const sentToday = await prisma.scheduledReminder.count({
    where: { userId: row.userId, sentAt: { gte: startOfBakuDay(now) } },
  });
  if (sentToday >= MAX_MESSAGES_PER_USER_PER_DAY) {
    return defer(row.id, new Date(now.getTime() + 6 * 60 * 60 * 1000), "daily message cap");
  }

  let ctx: ReminderContext;

  if (row.kind === "APPOINTMENT" || row.kind === "CONFIRMATION") {
    const b = row.booking;
    if (!b || b.status !== "CONFIRMED") {
      return finalize(row.id, "CANCELLED", "booking no longer confirmed", "cancelled");
    }
    if (b.startAt.getTime() - AZT_OFFSET_MS <= now.getTime()) {
      return finalize(row.id, "SKIPPED", "appointment already started", "skipped");
    }
    ctx = {
      kind: row.kind,
      channel,
      userName: row.user.name,
      store: row.store,
      staffName: b.storeMember?.user?.name ?? null,
      startAt: b.startAt,
      unsubscribeUrl: null,
    };
  } else {
    if (row.user.winbackOptOut) return finalize(row.id, "SKIPPED", "opted out", "skipped");

    const horizon = new Date(now.getTime() + AZT_OFFSET_MS);
    const upcoming = await prisma.booking.count({
      where: {
        userId: row.userId,
        storeId: row.storeId,
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
        startAt: { gt: horizon },
      },
    });
    if (upcoming > 0) return finalize(row.id, "SKIPPED", "already rebooked", "skipped");

    const windowStart = new Date(now.getTime() - WINBACK_PER_USER_WINDOW_DAYS * DAY_MS);
    const recentWinbacks = await prisma.scheduledReminder.count({
      where: { userId: row.userId, kind: "WINBACK", status: "SENT", sentAt: { gte: windowStart } },
    });
    if (recentWinbacks >= WINBACK_MAX_PER_USER_PER_WINDOW) {
      return defer(row.id, new Date(now.getTime() + 3 * DAY_MS), "win-back frequency cap");
    }

    ctx = {
      kind: "WINBACK",
      channel,
      userName: row.user.name,
      store: row.store,
      staffName: null,
      startAt: null,
      unsubscribeUrl: unsubscribeUrl(row.userId),
    };
  }

  const message = renderReminder(ctx);
  try {
    await reserveSend({
      channel,
      recipient: channel === "SMS" ? (row.user.phone as string) : (row.user.email as string),
      kind: "REMINDER",
    });
  } catch (err) {
    // Out of budget for now: retry in an hour without spending an attempt,
    // so a busy day delays reminders instead of dropping them.
    if (err instanceof SendBudgetError) {
      return defer(row.id, new Date(now.getTime() + 60 * 60 * 1000), err.message, row.attempts);
    }
    throw err;
  }
  try {
    if (channel === "SMS") {
      await smsProvider.send(row.user.phone as string, message.text);
    } else {
      await emailProvider.send(
        row.user.email as string,
        message.subject,
        message.text,
        message.html ? { html: message.html } : undefined,
      );
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const attempts = row.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      return finalize(row.id, "FAILED", reason, "failed", attempts);
    }
    return defer(row.id, new Date(now.getTime() + backoffMs(attempts)), reason, attempts);
  }

  await prisma.scheduledReminder.update({
    where: { id: row.id },
    data: { status: "SENT", sentAt: new Date(), lastError: null },
  });
  return "sent";
}

async function claimDue(now: Date, limit: number): Promise<{ id: string }[]> {
  return prisma.$queryRaw<{ id: string }[]>`
    UPDATE "ScheduledReminder"
    SET status = 'SENDING', "updatedAt" = now()
    WHERE id IN (
      SELECT id FROM "ScheduledReminder"
      WHERE status = 'PENDING' AND "sendAt" <= ${now}
      ORDER BY "sendAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id
  `;
}

// A row left in SENDING past the cutoff means a run died mid-send. Bump its
// attempt count (so a row that crashes the process can't loop forever) and
// requeue or fail it.
async function requeueStuck(now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - STUCK_AFTER_MS);
  await prisma.$executeRaw`
    UPDATE "ScheduledReminder"
    SET
      status = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN 'FAILED'::"ReminderStatus" ELSE 'PENDING'::"ReminderStatus" END,
      attempts = attempts + 1,
      "lastError" = 'requeued after stuck send',
      "updatedAt" = now()
    WHERE status = 'SENDING' AND "updatedAt" < ${cutoff}
  `;
}

function finalize(
  id: string,
  status: "SKIPPED" | "FAILED" | "CANCELLED",
  lastError: string,
  outcome: Outcome,
  attempts?: number,
): Promise<Outcome> {
  return prisma.scheduledReminder
    .update({
      where: { id },
      data: { status, lastError, ...(attempts != null ? { attempts } : {}) },
    })
    .then(() => outcome);
}

function defer(id: string, sendAt: Date, lastError: string, attempts?: number): Promise<Outcome> {
  return prisma.scheduledReminder
    .update({
      where: { id },
      data: { status: "PENDING", sendAt, lastError, ...(attempts != null ? { attempts } : {}) },
    })
    .then(() => "deferred" as const);
}

function backoffMs(attempts: number): number {
  return Math.min(30 * 60 * 1000, 5 * 60 * 1000 * 2 ** (attempts - 1));
}

function startOfBakuDay(now: Date): Date {
  const baku = new Date(now.getTime() + AZT_OFFSET_MS);
  const midnightLabeled = Date.UTC(baku.getUTCFullYear(), baku.getUTCMonth(), baku.getUTCDate());
  return new Date(midnightLabeled - AZT_OFFSET_MS);
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<unknown>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await fn(items[index]);
    }
  });
  await Promise.all(workers);
}
