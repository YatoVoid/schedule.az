// A whole-day exception (see prisma schema) has no hours of its own, so a
// FREE exception on an otherwise-closed day falls back to this default
// working range. Matches the default AvailabilityEditor pre-fills when a
// staff member first switches a day on.
const DEFAULT_FREE_DAY_START = 540; // 9:00 AM
const DEFAULT_FREE_DAY_END = 1080; // 6:00 PM

const SLOT_STEP_MINUTES = 30;

export type WeeklyHours = Record<number, { startMinute: number; endMinute: number } | undefined>;

export type ScheduleException = {
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  type: "BUSY" | "FREE";
  recurringAnnually: boolean;
};

export type BusyInterval = { startMinute: number; endMinute: number };

function monthDay(iso: string) {
  return iso.slice(5);
}

function exceptionCovers(ex: ScheduleException, iso: string): boolean {
  if (ex.recurringAnnually) {
    const md = monthDay(iso);
    return md >= monthDay(ex.startDate) && md <= monthDay(ex.endDate);
  }
  return iso >= ex.startDate && iso <= ex.endDate;
}

// dateIso is a plain "YYYY-MM-DD" for a specific day, dayOfWeek is 0=Sunday.
function getOpenRange(
  dateIso: string,
  dayOfWeek: number,
  weeklyHours: WeeklyHours,
  exceptions: ScheduleException[],
): { startMinute: number; endMinute: number } | null {
  const isBusy = exceptions.some((ex) => ex.type === "BUSY" && exceptionCovers(ex, dateIso));
  if (isBusy) return null;

  const weekly = weeklyHours[dayOfWeek];
  if (weekly) return weekly;

  const isFree = exceptions.some((ex) => ex.type === "FREE" && exceptionCovers(ex, dateIso));
  if (isFree) return { startMinute: DEFAULT_FREE_DAY_START, endMinute: DEFAULT_FREE_DAY_END };

  return null;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

// Returns candidate slot start times (minutes since midnight) for a given
// calendar day, filtered against existing bookings and (if the date is
// today) the current time. Step is fixed at 30 minutes, a booking site
// convention, not tied to service duration, so a 45-minute service still
// offers slots on the half hour.
export function computeAvailableSlots(params: {
  dateIso: string;
  dayOfWeek: number;
  serviceDurationMin: number;
  weeklyHours: WeeklyHours;
  exceptions: ScheduleException[];
  existingBookings: BusyInterval[];
  now?: Date;
}): number[] {
  const range = getOpenRange(params.dateIso, params.dayOfWeek, params.weeklyHours, params.exceptions);
  if (!range) return [];

  const now = params.now ?? new Date();
  const nowIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = nowIso === params.dateIso;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: number[] = [];
  for (let start = range.startMinute; start + params.serviceDurationMin <= range.endMinute; start += SLOT_STEP_MINUTES) {
    if (isToday && start <= nowMinutes) continue;
    const end = start + params.serviceDurationMin;
    const conflicts = params.existingBookings.some((b) => overlaps(start, end, b.startMinute, b.endMinute));
    if (!conflicts) slots.push(start);
  }
  return slots;
}

export function dateToIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatMinutes(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function isoToDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
