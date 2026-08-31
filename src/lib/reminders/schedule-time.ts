import { bakuHourOnDayOf, bakuLabeledToRealUtc, AZT_OFFSET_MS } from "@/lib/baku-time";
import {
  APPOINTMENT_HOUR_BAKU,
  APPOINTMENT_MIN_LEAD_MS,
  WINBACK_HOUR_BAKU,
} from "@/lib/reminders/config";

// All inputs here are booking timestamps (UTC-labeled Baku wall time); all
// outputs are real UTC instants ready to compare against Date.now().

export function appointmentSendAt(startAt: Date): Date {
  const morning = bakuHourOnDayOf(startAt, APPOINTMENT_HOUR_BAKU).getTime();
  const twoHoursBefore = bakuLabeledToRealUtc(startAt).getTime() - APPOINTMENT_MIN_LEAD_MS;
  return new Date(Math.min(morning, twoHoursBefore));
}

export function winbackSendAt(visitEndAt: Date, intervalDays: number): Date {
  const dueReal = bakuLabeledToRealUtc(visitEndAt).getTime() + intervalDays * 24 * 60 * 60 * 1000;
  // Re-label to Baku to find the calendar day, then pin the hour so the
  // nudge never lands in the middle of the night.
  const dueLabeled = new Date(dueReal + AZT_OFFSET_MS);
  return bakuHourOnDayOf(dueLabeled, WINBACK_HOUR_BAKU);
}
