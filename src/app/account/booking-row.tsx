"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { formatBookingTime } from "@/lib/baku-time";
import { CategoryIcon } from "@/components/category-icon";
import { Calendar } from "@/components/ui/calendar";
import { AddToCalendar } from "@/components/add-to-calendar";
import { dateToIso, isoToDate, formatMinutes } from "@/lib/schedule";
import {
  getRescheduleDatesAction,
  getRescheduleSlotsAction,
  rescheduleBookingAction,
  cancelBookingAction,
} from "./actions";

const DATE_WINDOW_DAYS = 90;

export type AccountBooking = {
  id: string;
  storeName: string;
  storeSlug: string;
  storeAddress: string | null;
  storeCategory: string;
  serviceName: string;
  staffName: string;
  startAt: string; // ISO
  endAt: string; // ISO
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";
  note: string | null;
  unseen: boolean;
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export function BookingRow({ booking, canManage }: { booking: AccountBooking; canManage: boolean }) {
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState<number[] | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string> | null>(null);
  const [isPending, startTransition] = useTransition();

  function openReschedule() {
    setMode("reschedule");
    loadSlots(date);
    loadDates();
  }

  function loadDates() {
    setAvailableDates(null);
    startTransition(async () => {
      const from = dateToIso(new Date());
      const to = dateToIso(new Date(Date.now() + DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000));
      const result = await getRescheduleDatesAction(booking.id, from, to);
      const dates = result.ok ? result.dates : [];
      setAvailableDates(new Set(dates));
      // Same "don't make them guess" fix as the initial booking flow: land
      // on a real open day instead of "today" if today is closed.
      if (dates.length > 0 && !dates.includes(dateToIso(date))) {
        const next = isoToDate(dates[0]);
        setDate(next);
        loadSlots(next);
      }
    });
  }

  function loadSlots(d: Date) {
    setSlots(null);
    startTransition(async () => {
      const result = await getRescheduleSlotsAction(booking.id, dateToIso(d));
      setSlots(result.ok ? result.slots : []);
    });
  }

  function pickSlot(minute: number) {
    startTransition(async () => {
      const result = await rescheduleBookingAction(booking.id, dateToIso(date), minute);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Rescheduled, waiting for the business to confirm");
      setMode("view");
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBookingAction(booking.id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className={`surface p-4 sm:p-5 ${booking.unseen ? "border-primary" : ""}`}>
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage-soft text-primary">
          <CategoryIcon category={booking.storeCategory} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {booking.unseen && <span className="h-2 w-2 shrink-0 rounded-full bg-coral" />}
            <p className="truncate text-base font-semibold">{booking.serviceName}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {booking.storeName} · with {booking.staffName}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {formatBookingTime(booking.startAt, DATE_FORMAT)}
          </p>
        </div>
        <StatusPill status={booking.status} />
      </div>

      {booking.note && (
        <p className="mt-3 rounded-lg bg-sage-soft p-3 text-sm sm:ml-15">
          <span className="font-medium">Message from {booking.staffName}: </span>
          {booking.note}
        </p>
      )}

      {booking.status === "CONFIRMED" && (
        <div className="mt-3 sm:ml-15">
          <AddToCalendar
            align="start"
            bookingId={booking.id}
            title={`${booking.serviceName} at ${booking.storeName}`}
            description={`Booked via Schedule.az with ${booking.staffName}`}
            location={booking.storeAddress}
            startAt={booking.startAt}
            endAt={booking.endAt}
          />
        </div>
      )}

      {canManage && mode === "view" && (
        <div className="mt-3 flex gap-2 sm:ml-15">
          <Button variant="outline" size="sm" onClick={openReschedule}>
            Reschedule
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="mt-4 flex flex-col gap-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (!d) return;
              setDate(d);
              loadSlots(d);
            }}
            disabled={[
              { before: new Date(new Date().setHours(0, 0, 0, 0)) },
              ...(availableDates ? [(d: Date) => !availableDates.has(dateToIso(d))] : []),
            ]}
            modifiers={{ open: (d) => availableDates?.has(dateToIso(d)) ?? false }}
            modifiersClassNames={{ open: "bg-primary/10 font-medium" }}
            className="self-center rounded-xl border"
          />
          {availableDates === null ? (
            <p className="text-center text-sm text-muted-foreground">Finding open days...</p>
          ) : availableDates.size === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No openings in the next {DATE_WINDOW_DAYS} days.
            </p>
          ) : slots === null ? (
            <p className="text-center text-sm text-muted-foreground">Loading times...</p>
          ) : slots.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No times available this day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((m) => (
                <Button key={m} variant="outline" size="sm" disabled={isPending} onClick={() => pickSlot(m)}>
                  {formatMinutes(m)}
                </Button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="self-start text-sm text-muted-foreground underline underline-offset-4"
            onClick={() => setMode("view")}
          >
            Cancel reschedule
          </button>
        </div>
      )}
    </div>
  );
}
