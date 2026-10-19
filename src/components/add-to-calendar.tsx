"use client";

import { CalendarPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildGoogleCalendarUrl } from "@/lib/calendar-links";

export function AddToCalendar({
  bookingId,
  title,
  description,
  location,
  startAt,
  endAt,
  align = "center",
}: {
  align?: "center" | "start";
  bookingId: string;
  title: string;
  description: string;
  location: string | null;
  startAt: string;
  endAt: string;
}) {
  const googleUrl = buildGoogleCalendarUrl({
    title,
    description,
    location,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
  });

  return (
    <div className={`flex flex-wrap gap-2 ${align === "center" ? "justify-center" : "justify-start"}`}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        render={<a href={googleUrl} target="_blank" rel="noopener noreferrer" />}
        nativeButton={false}
      >
        <CalendarPlusIcon className="size-3.5" />
        Add to Google Calendar
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        render={<a href={`/api/bookings/${bookingId}/calendar.ics`} />}
        nativeButton={false}
      >
        <CalendarPlusIcon className="size-3.5" />
        Add to Apple Calendar
      </Button>
    </div>
  );
}
