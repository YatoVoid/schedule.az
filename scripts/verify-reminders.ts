import { prisma } from "../src/lib/prisma";
import { planReminders } from "../src/lib/reminders/plan";
import { runDueReminders } from "../src/lib/reminders/send";
import { enqueueConfirmation } from "../src/lib/reminders/enqueue";
import { appointmentSendAt } from "../src/lib/reminders/schedule-time";
import { resolveReturnIntervalDays } from "../src/lib/return-cadence";
import { AZT_OFFSET_MS } from "../src/lib/baku-time";
import { unsubscribeToken, verifyUnsubscribeToken } from "../src/lib/unsubscribe";

// End-to-end check of the reminder pipeline against console SMS/email
// providers. Builds its own isolated store + customers (phones in a
// dedicated +9945599900xx range, slug "reminders-verify"), never touches
// the canonical 0000/0001/0002 accounts, and deletes everything it made on
// the way out.

const SLUG = "reminders-verify";
const DAY_MS = 24 * 60 * 60 * 1000;

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}

function bakuLabeled(realInstant: number): Date {
  return new Date(realInstant + AZT_OFFSET_MS);
}

async function cleanup() {
  await prisma.store.deleteMany({ where: { slug: SLUG } });
  await prisma.user.deleteMany({ where: { phone: { startsWith: "+9945599900" } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@reminders-verify.test" } } });
}

async function main() {
  await cleanup();

  const store = await prisma.store.create({
    data: {
      slug: SLUG,
      name: "Verify Barbershop",
      category: "Barbershop",
      description: "A test barbershop used only by scripts/verify-reminders.ts.",
      address: "12 Nizami St, Baku",
      latitude: 40.3777,
      longitude: 49.892,
    },
  });
  const service = await prisma.service.create({
    data: { storeId: store.id, name: "Haircut", durationMin: 30, priceAzn: "15.00" },
  });
  const staffUser = await prisma.user.create({
    data: { phone: "+994559990010", name: "Rəşad" },
  });
  const staff = await prisma.storeMember.create({
    data: { storeId: store.id, userId: staffUser.id, role: "STAFF" },
  });

  const phoneUser = await prisma.user.create({ data: { phone: "+994559990001", name: "Aygün" } });
  const bothUser = await prisma.user.create({
    data: { phone: "+994559990002", email: "both@reminders-verify.test", name: "Kamran" },
  });
  const emailUser = await prisma.user.create({
    data: { email: "email-only@reminders-verify.test", name: "Leyla" },
  });
  // Used only for the win-back checks: no upcoming booking, so nothing
  // legitimately suppresses the nudge.
  const winbackUser = await prisma.user.create({
    data: { phone: "+994559990003", email: "winback@reminders-verify.test", name: "Nigar" },
  });

  const now = new Date();

  // --- APPOINTMENT: one confirmed booking ~3h out for each contact shape ---
  const startReal = now.getTime() + 3 * 60 * 60 * 1000;
  const startAt = bakuLabeled(startReal);
  const endAt = bakuLabeled(startReal + service.durationMin * 60_000);

  await Promise.all(
    [phoneUser, bothUser, emailUser].map((u) =>
      prisma.booking.create({
        data: {
          storeId: store.id,
          serviceId: service.id,
          storeMemberId: staff.id,
          userId: u.id,
          startAt,
          endAt,
          status: "CONFIRMED",
        },
      }),
    ),
  );

  await planReminders(now);

  const apptReminders = await prisma.scheduledReminder.findMany({
    where: { kind: "APPOINTMENT", storeId: store.id },
    orderBy: { userId: "asc" },
  });
  check("appointment reminder created per booking", apptReminders.length === 3, `got ${apptReminders.length}`);

  const byUser = new Map(apptReminders.map((r) => [r.userId, r]));
  check("phone-only user -> SMS", byUser.get(phoneUser.id)?.channel === "SMS");
  check("phone+email user -> SMS", byUser.get(bothUser.id)?.channel === "SMS");
  check("email-only user -> EMAIL", byUser.get(emailUser.id)?.channel === "EMAIL");

  const expectedSendAt = appointmentSendAt(startAt).getTime();
  check(
    "appointment sendAt is morning-of / 2h-before",
    byUser.get(phoneUser.id)?.sendAt.getTime() === expectedSendAt,
    `${byUser.get(phoneUser.id)?.sendAt.toISOString()} vs ${new Date(expectedSendAt).toISOString()}`,
  );

  // Idempotent: a second plan makes no duplicates and no churn.
  await planReminders(now);
  const afterSecondPlan = await prisma.scheduledReminder.count({
    where: { kind: "APPOINTMENT", storeId: store.id },
  });
  check("planning is idempotent", afterSecondPlan === 3, `count ${afterSecondPlan}`);

  // --- APPOINTMENT send: run with a clock just past the send time ---
  const sendNow = new Date(expectedSendAt + 60_000);
  const sendSummary = await runDueReminders(sendNow);
  check("appointment reminders sent", sendSummary.sent === 3, JSON.stringify(sendSummary));

  const sentStatuses = await prisma.scheduledReminder.findMany({
    where: { kind: "APPOINTMENT", storeId: store.id },
    select: { status: true, sentAt: true },
  });
  check(
    "appointment rows marked SENT",
    sentStatuses.every((r) => r.status === "SENT" && r.sentAt),
    sentStatuses.map((r) => r.status).join(","),
  );

  // --- APPOINTMENT cancel: declining a booking cancels its reminder ---
  const freshBooking = await prisma.booking.create({
    data: {
      storeId: store.id,
      serviceId: service.id,
      storeMemberId: staff.id,
      userId: phoneUser.id,
      startAt: bakuLabeled(now.getTime() + 30 * 60 * 60 * 1000),
      endAt: bakuLabeled(now.getTime() + 30 * 60 * 60 * 1000 + service.durationMin * 60_000),
      status: "CONFIRMED",
    },
  });
  await planReminders(now);
  await prisma.booking.update({ where: { id: freshBooking.id }, data: { status: "DECLINED" } });
  await planReminders(now);
  const cancelled = await prisma.scheduledReminder.findUnique({
    where: { dedupeKey: `appt:${freshBooking.id}` },
  });
  check("declined booking cancels its reminder", cancelled?.status === "CANCELLED", cancelled?.status);

  // --- CONFIRMATION: enqueued when a pending booking is accepted ---
  const pendingBooking = await prisma.booking.create({
    data: {
      storeId: store.id,
      serviceId: service.id,
      storeMemberId: staff.id,
      userId: emailUser.id,
      startAt: bakuLabeled(now.getTime() + 26 * 60 * 60 * 1000),
      endAt: bakuLabeled(now.getTime() + 26 * 60 * 60 * 1000 + service.durationMin * 60_000),
      status: "PENDING_CONFIRMATION",
    },
  });

  // Accept it, then enqueue exactly as the staff/admin action does.
  await prisma.booking.update({ where: { id: pendingBooking.id }, data: { status: "CONFIRMED" } });
  const b1 = await prisma.booking.findUnique({ where: { id: pendingBooking.id } });
  await enqueueConfirmation(pendingBooking.id);
  await enqueueConfirmation(pendingBooking.id); // double submit
  const confirmRows = await prisma.scheduledReminder.findMany({
    where: { kind: "CONFIRMATION", bookingId: pendingBooking.id },
  });
  check("accepting a booking queues one confirmation", confirmRows.length === 1, `got ${confirmRows.length}`);
  check("confirmation channel matches contact", confirmRows[0]?.channel === "EMAIL");

  const confirmSend = await runDueReminders(new Date(now.getTime() + 60_000));
  check("confirmation sent", confirmSend.sent >= 1, JSON.stringify(confirmSend));
  const confirmSent = await prisma.scheduledReminder.findUnique({
    where: { dedupeKey: `confirm:${pendingBooking.id}:${b1!.startAt.getTime()}` },
  });
  check("confirmation row marked SENT", confirmSent?.status === "SENT", confirmSent?.status);

  // Reschedule -> re-accept -> a fresh confirmation for the new time.
  const movedStart = bakuLabeled(now.getTime() + 50 * 60 * 60 * 1000);
  await prisma.booking.update({
    where: { id: pendingBooking.id },
    data: { startAt: movedStart, status: "CONFIRMED", rescheduledAt: new Date() },
  });
  await enqueueConfirmation(pendingBooking.id);
  const confirmAfterMove = await prisma.scheduledReminder.count({
    where: { kind: "CONFIRMATION", bookingId: pendingBooking.id },
  });
  check("reschedule + re-accept queues a new confirmation", confirmAfterMove === 2, `count ${confirmAfterMove}`);

  // Declined booking: nothing queued.
  const declinedBooking = await prisma.booking.create({
    data: {
      storeId: store.id,
      serviceId: service.id,
      storeMemberId: staff.id,
      userId: emailUser.id,
      startAt: bakuLabeled(now.getTime() + 40 * 60 * 60 * 1000),
      endAt: bakuLabeled(now.getTime() + 40 * 60 * 60 * 1000 + service.durationMin * 60_000),
      status: "DECLINED",
    },
  });
  await enqueueConfirmation(declinedBooking.id);
  const declinedConfirm = await prisma.scheduledReminder.count({
    where: { kind: "CONFIRMATION", bookingId: declinedBooking.id },
  });
  check("declined booking queues no confirmation", declinedConfirm === 0);

  // --- WINBACK: a completed visit in the past arms a single nudge ---
  const interval = resolveReturnIntervalDays(store.category);
  const visitEndReal = now.getTime() - interval * DAY_MS;
  await prisma.booking.create({
    data: {
      storeId: store.id,
      serviceId: service.id,
      storeMemberId: staff.id,
      userId: winbackUser.id,
      startAt: bakuLabeled(visitEndReal - service.durationMin * 60_000),
      endAt: bakuLabeled(visitEndReal),
      status: "COMPLETED",
      priceAzn: "15.00",
    },
  });
  await planReminders(now);
  const winback = await prisma.scheduledReminder.findUnique({
    where: { dedupeKey: `winback:${winbackUser.id}:${store.id}` },
  });
  check("win-back reminder armed after completed visit", !!winback && winback.kind === "WINBACK");
  check("win-back uses SMS for phone+email user", winback?.channel === "SMS");
  check("win-back is due around now", !!winback && Math.abs(winback.sendAt.getTime() - now.getTime()) < 2 * DAY_MS);

  const afterWinbackDue = new Date((winback?.sendAt.getTime() ?? now.getTime()) + 60_000);
  const winbackSend = await runDueReminders(afterWinbackDue);
  check("win-back reminder sent", winbackSend.sent >= 1, JSON.stringify(winbackSend));
  const winbackAfter = await prisma.scheduledReminder.findUnique({
    where: { dedupeKey: `winback:${winbackUser.id}:${store.id}` },
  });
  check("win-back row marked SENT", winbackAfter?.status === "SENT", winbackAfter?.status);

  // Not re-armed without a new visit.
  await planReminders(afterWinbackDue);
  const winbackStill = await prisma.scheduledReminder.findUnique({
    where: { dedupeKey: `winback:${winbackUser.id}:${store.id}` },
  });
  check("win-back not resent without a new visit", winbackStill?.status === "SENT", winbackStill?.status);

  // A newer completed visit re-arms it.
  await prisma.booking.create({
    data: {
      storeId: store.id,
      serviceId: service.id,
      storeMemberId: staff.id,
      userId: winbackUser.id,
      startAt: bakuLabeled(now.getTime() - service.durationMin * 60_000),
      endAt: bakuLabeled(now.getTime()),
      status: "COMPLETED",
      priceAzn: "15.00",
    },
  });
  await planReminders(new Date(now.getTime() + 120_000));
  const winbackRearmed = await prisma.scheduledReminder.findUnique({
    where: { dedupeKey: `winback:${winbackUser.id}:${store.id}` },
  });
  check(
    "new visit re-arms the win-back",
    winbackRearmed?.status === "PENDING" && winbackRearmed.sendAt.getTime() > now.getTime(),
    `${winbackRearmed?.status} @ ${winbackRearmed?.sendAt.toISOString()}`,
  );

  // --- Opt-out: flag suppresses win-back, appointment still allowed ---
  await prisma.user.update({ where: { id: winbackUser.id }, data: { winbackOptOut: true } });
  await planReminders(new Date(now.getTime() + 180_000));
  const winbackOptedOut = await prisma.scheduledReminder.findUnique({
    where: { dedupeKey: `winback:${winbackUser.id}:${store.id}` },
  });
  check("opt-out sets win-back to SKIPPED", winbackOptedOut?.status === "SKIPPED", winbackOptedOut?.status);

  const token = unsubscribeToken(winbackUser.id);
  check("unsubscribe token round-trips", verifyUnsubscribeToken(token) === winbackUser.id);
  check("tampered unsubscribe token rejected", verifyUnsubscribeToken(token.slice(0, -2) + "xx") === null);

  await cleanup();
  console.log(failures === 0 ? "\nAll reminder checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await cleanup().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
