"use client";

import { Calendar } from "@/components/ui/calendar";

export type ScheduleException = {
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  type: "BUSY" | "FREE";
  recurringAnnually: boolean;
};

function dateToIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthDay(iso: string) {
  return iso.slice(5); // "MM-DD"
}

function exceptionCovers(ex: ScheduleException, iso: string): boolean {
  if (ex.recurringAnnually) {
    const md = monthDay(iso);
    return md >= monthDay(ex.startDate) && md <= monthDay(ex.endDate);
  }
  return iso >= ex.startDate && iso <= ex.endDate;
}

// Priority, matches the color legend: a busy exception always wins (red),
// then an actual booking (darker), then a free-day exception opening up an
// otherwise-closed day (green), then a plain open working day (gray).
// Ordinary closed days with nothing special about them are left unstyled.
function computeStatus(
  date: Date,
  weeklyDays: Set<number>,
  exceptions: ScheduleException[],
  bookedDates: Set<string>,
): "busy" | "booked" | "free" | "open" | null {
  const iso = dateToIso(date);
  const isBusyException = exceptions.some((ex) => ex.type === "BUSY" && exceptionCovers(ex, iso));
  if (isBusyException) return "busy";

  const isBooked = bookedDates.has(iso);
  const isWorkingDay = weeklyDays.has(date.getDay());
  const isFreeException = exceptions.some((ex) => ex.type === "FREE" && exceptionCovers(ex, iso));

  if (isBooked && (isWorkingDay || isFreeException)) return "booked";
  if (isWorkingDay) return "open";
  if (isFreeException) return "free";
  return null;
}

export function StaffScheduleCalendar({
  weeklyAvailability,
  exceptions,
  bookedDates,
}: {
  weeklyAvailability: Record<number, { startMinute: number; endMinute: number } | undefined>;
  exceptions: ScheduleException[];
  bookedDates: string[]; // "YYYY-MM-DD"
}) {
  const weeklyDays = new Set(
    Object.entries(weeklyAvailability)
      .filter(([, v]) => v)
      .map(([k]) => Number(k)),
  );
  const bookedSet = new Set(bookedDates);

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        mode="single"
        selected={undefined}
        onSelect={() => {}}
        modifiers={{
          busy: (date) => computeStatus(date, weeklyDays, exceptions, bookedSet) === "busy",
          booked: (date) => computeStatus(date, weeklyDays, exceptions, bookedSet) === "booked",
          free: (date) => computeStatus(date, weeklyDays, exceptions, bookedSet) === "free",
          open: (date) => computeStatus(date, weeklyDays, exceptions, bookedSet) === "open",
        }}
        modifiersClassNames={{
          busy: "bg-destructive/15 text-destructive rounded-[var(--cell-radius)]",
          booked: "bg-muted-foreground/30 text-foreground rounded-[var(--cell-radius)]",
          free: "bg-primary/15 text-primary rounded-[var(--cell-radius)]",
          open: "bg-muted text-foreground rounded-[var(--cell-radius)]",
        }}
        className="self-center rounded-xl border"
      />
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendDot className="bg-muted" label="Open" />
        <LegendDot className="bg-muted-foreground/30" label="Booked" />
        <LegendDot className="bg-primary/15" label="Free (extra)" />
        <LegendDot className="bg-destructive/15" label="Busy" />
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
