// External calendar apps take a literal "Z" as real UTC and convert it to
// the viewer's own timezone, so before handing a booking time to
// Google/Apple it has to be shifted back to a true UTC instant. See
// src/lib/baku-time.ts for the offset convention.
import { bakuLabeledToRealUtc as toRealUtc, bakuHourOnDayOf } from "@/lib/baku-time";

function icsTimestamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export type CalendarEvent = {
  title: string;
  description: string;
  location: string | null;
  startAt: Date;
  endAt: Date;
};

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const start = toRealUtc(event.startAt);
  const end = toRealUtc(event.endAt);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${icsTimestamp(start)}/${icsTimestamp(end)}`,
    details: event.description,
    location: event.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// The in-calendar alarm fires at 8:00 AM Baku time on the day of the
// appointment, a fixed morning nudge rather than "N hours before."
function morningReminderUtc(appointmentStartAt: Date): Date {
  return bakuHourOnDayOf(appointmentStartAt, 8);
}

export function buildIcsFile(event: CalendarEvent & { uid: string }): string {
  const start = toRealUtc(event.startAt);
  const end = toRealUtc(event.endAt);
  const reminder = morningReminderUtc(event.startAt);
  const now = icsTimestamp(new Date());

  const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Schedule.az//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.uid}@schedule.az`,
    `DTSTAMP:${now}`,
    `DTSTART:${icsTimestamp(start)}`,
    `DTEND:${icsTimestamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description)}`,
    ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(event.title)}`,
    `TRIGGER;VALUE=DATE-TIME:${icsTimestamp(reminder)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
