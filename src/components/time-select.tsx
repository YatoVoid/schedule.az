"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = [0, 15, 30, 45];

function to12Hour(minutesSinceMidnight: number) {
  const totalMinutes = ((minutesSinceMidnight % 1440) + 1440) % 1440;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period: "AM" | "PM" = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, period };
}

function to24HourMinutes(hour12: number, minute: number, period: "AM" | "PM") {
  const hour24 = period === "AM" ? (hour12 % 12) : (hour12 % 12) + 12;
  return hour24 * 60 + minute;
}

// Booking.com-style dropdown time picker (hour / minute / AM-PM), stored as
// minutes-since-midnight to match StaffAvailability.startMinute/endMinute.
export function TimeSelect({
  minutes,
  onChange,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  const { hour12, minute, period } = to12Hour(minutes);

  function update(next: Partial<{ hour12: number; minute: number; period: "AM" | "PM" }>) {
    onChange(
      to24HourMinutes(next.hour12 ?? hour12, next.minute ?? minute, next.period ?? period),
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select value={String(hour12)} onValueChange={(v) => v && update({ hour12: Number(v) })}>
        <SelectTrigger className="h-10 w-[4.5rem] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS_12.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={String(minute)} onValueChange={(v) => v && update({ minute: Number(v) })}>
        <SelectTrigger className="h-10 w-[4.5rem] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {m.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={(v) => v && update({ period: v as "AM" | "PM" })}>
        <SelectTrigger className="h-10 w-[4.5rem] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
