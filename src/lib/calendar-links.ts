// Booking.startAt/endAt are stored as UTC-labeled timestamps whose digits
// actually represent Baku wall-clock time (AZT, UTC+4, no DST) — the whole
// booking engine (src/lib/schedule.ts) works this way consistently, on the
// assumption the server process itself runs with TZ=UTC. External calendar
// apps take a literal "Z" as real UTC and convert it to the viewer's own
// timezone, so before handing a time to Google/Apple we have to shift it
// back by the AZT offset to produce the true UTC instant — otherwise the
// event would land 4 hours later than the actual appointment for anyone
// not viewing from a UTC-clock device.
const AZT_OFFSET_HOURS = 4;

function toRealUtc(appDate: Date): Date {
  return new Date(appDate.getTime() - AZT_OFFSET_HOURS * 60 * 60 * 1000);
}

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

// Reminder fires at 8:00 AM Baku time on the day of the appointment,
// regardless of what time the appointment itself is at — a fixed morning
// nudge, not "N hours before," so it still fires a sensible amount ahead of
// an early-morning booking and isn't a same-minute surprise for a late one.
function morningReminderUtc(appointmentStartAt: Date): Date {
  const morningInAppUtc = new Date(
    Date.UTC(
      appointmentStartAt.getUTCFullYear(),
      appointmentStartAt.getUTCMonth(),
      appointmentStartAt.getUTCDate(),
      8,
      0,
      0,
    ),
  );
  return toRealUtc(morningInAppUtc);
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
