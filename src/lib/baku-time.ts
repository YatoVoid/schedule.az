// Booking.startAt/endAt are UTC-labeled Dates whose digits actually
// represent Baku wall-clock time (AZT, UTC+4, no DST). The booking engine
// in src/lib/schedule.ts works entirely in that convention, on the
// assumption the server process runs with TZ=UTC. Anything that compares a
// booking time against a real instant (calendar files, the reminder
// scheduler) has to shift it back to true UTC first, or it lands 4 hours
// off for anyone not on a UTC-clock device.
export const AZT_OFFSET_MS = 4 * 60 * 60 * 1000;

export function bakuLabeledToRealUtc(appDate: Date): Date {
  return new Date(appDate.getTime() - AZT_OFFSET_MS);
}

// Real UTC instant for HH:00 Baku time on the same calendar day as `ref`
// (whose digits are read as Baku wall time).
export function bakuHourOnDayOf(ref: Date, hour: number): Date {
  const labeled = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), hour, 0, 0);
  return bakuLabeledToRealUtc(new Date(labeled));
}
