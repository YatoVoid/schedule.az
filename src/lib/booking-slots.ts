import { prisma } from "@/lib/prisma";
import { computeAvailableSlots, dateToIso, isoToDate, type ScheduleException, type BusyInterval } from "@/lib/schedule";

async function loadScheduleInputs(storeMemberId: string, dateIso: string, excludeBookingId?: string) {
  const [availability, exceptions, bookings] = await Promise.all([
    prisma.staffAvailability.findMany({ where: { storeMemberId } }),
    prisma.availabilityException.findMany({ where: { storeMemberId } }),
    prisma.booking.findMany({
      where: {
        storeMemberId,
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
        startAt: { gte: new Date(`${dateIso}T00:00:00.000Z`), lt: new Date(`${dateIso}T23:59:59.999Z`) },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const weeklyHours: Record<number, { startMinute: number; endMinute: number }> = {};
  for (const a of availability) weeklyHours[a.dayOfWeek] = a;

  const scheduleExceptions: ScheduleException[] = exceptions.map((e) => ({
    startDate: e.startDate.toISOString().slice(0, 10),
    endDate: e.endDate.toISOString().slice(0, 10),
    type: e.type,
    recurringAnnually: e.recurringAnnually,
  }));

  const existingBookings = bookings.map((b) => ({
    startMinute: b.startAt.getUTCHours() * 60 + b.startAt.getUTCMinutes(),
    endMinute: b.endAt.getUTCHours() * 60 + b.endAt.getUTCMinutes(),
  }));

  return { weeklyHours, scheduleExceptions, existingBookings };
}

async function loadScheduleInputsForRange(storeMemberId: string, fromIso: string, toIso: string, excludeBookingId?: string) {
  const [availability, exceptions, bookings] = await Promise.all([
    prisma.staffAvailability.findMany({ where: { storeMemberId } }),
    prisma.availabilityException.findMany({ where: { storeMemberId } }),
    prisma.booking.findMany({
      where: {
        storeMemberId,
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] },
        startAt: { gte: new Date(`${fromIso}T00:00:00.000Z`), lt: new Date(`${toIso}T23:59:59.999Z`) },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const weeklyHours: Record<number, { startMinute: number; endMinute: number }> = {};
  for (const a of availability) weeklyHours[a.dayOfWeek] = a;

  const scheduleExceptions: ScheduleException[] = exceptions.map((e) => ({
    startDate: e.startDate.toISOString().slice(0, 10),
    endDate: e.endDate.toISOString().slice(0, 10),
    type: e.type,
    recurringAnnually: e.recurringAnnually,
  }));

  const bookingsByDate = new Map<string, BusyInterval[]>();
  for (const b of bookings) {
    const dateKey = b.startAt.toISOString().slice(0, 10);
    const list = bookingsByDate.get(dateKey) ?? [];
    list.push({
      startMinute: b.startAt.getUTCHours() * 60 + b.startAt.getUTCMinutes(),
      endMinute: b.endAt.getUTCHours() * 60 + b.endAt.getUTCMinutes(),
    });
    bookingsByDate.set(dateKey, list);
  }

  return { weeklyHours, scheduleExceptions, bookingsByDate };
}

// excludeBookingId lets a reschedule check "is this slot free, ignoring the
// booking I'm currently moving" — otherwise the booking's own current slot
// would always appear taken.
export async function getSlotsForMemberService(
  storeMemberId: string,
  serviceDurationMin: number,
  dateIso: string,
  excludeBookingId?: string,
): Promise<number[]> {
  const { weeklyHours, scheduleExceptions, existingBookings } = await loadScheduleInputs(
    storeMemberId,
    dateIso,
    excludeBookingId,
  );
  const dayOfWeek = new Date(`${dateIso}T00:00:00.000Z`).getUTCDay();
  return computeAvailableSlots({
    dateIso,
    dayOfWeek,
    serviceDurationMin,
    weeklyHours,
    exceptions: scheduleExceptions,
    existingBookings,
  });
}

// Which days in [fromIso, toIso] have at least one open slot, so a calendar
// can show/enable only real options instead of making the customer click
// through empty days one at a time. One set of DB queries for the whole
// range, then pure in-memory computation per day, not N+1.
export async function getAvailableDaysInRange(
  storeMemberId: string,
  serviceDurationMin: number,
  fromIso: string,
  toIso: string,
  excludeBookingId?: string,
): Promise<string[]> {
  const { weeklyHours, scheduleExceptions, bookingsByDate } = await loadScheduleInputsForRange(
    storeMemberId,
    fromIso,
    toIso,
    excludeBookingId,
  );

  const available: string[] = [];
  const cursor = isoToDate(fromIso);
  const end = isoToDate(toIso);
  while (cursor <= end) {
    const iso = dateToIso(cursor);
    const dayOfWeek = new Date(`${iso}T00:00:00.000Z`).getUTCDay();
    const slots = computeAvailableSlots({
      dateIso: iso,
      dayOfWeek,
      serviceDurationMin,
      weeklyHours,
      exceptions: scheduleExceptions,
      existingBookings: bookingsByDate.get(iso) ?? [],
    });
    if (slots.length > 0) available.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return available;
}
