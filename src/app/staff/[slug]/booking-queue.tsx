"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { respondToBookingAction, completeBookingAction } from "./actions";

export type BookingRow = {
  id: string;
  serviceName: string;
  customerName: string;
  customerContact: string | null;
  startAt: string;
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";
  rescheduledAt: string | null;
};

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

// Groups a date-sorted list into day sections, so "20 bookings this week"
// reads as a handful of labeled days instead of one long list of raw dates.
function groupByDay<T extends { startAt: string }>(rows: T[]) {
  const groups: { label: string; rows: T[] }[] = [];
  for (const row of rows) {
    const label = dayLabel(row.startAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(row);
    else groups.push({ label, rows: [row] });
  }
  return groups;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function BookingQueue({ slug, bookings }: { slug: string; bookings: BookingRow[] }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function respond(id: string, status: "CONFIRMED" | "DECLINED") {
    startTransition(async () => {
      const result = await respondToBookingAction(slug, id, status, notes[id] ?? "");
      if (!result.ok) toast.error(result.error);
    });
  }

  function complete(id: string) {
    startTransition(async () => {
      const result = await completeBookingAction(slug, id, prices[id] ?? "");
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCompletingId(null);
      toast.success("Marked as completed");
    });
  }

  const pending = bookings.filter((b) => b.status === "PENDING_CONFIRMATION");
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED");
  const upcomingGroups = groupByDay(upcoming);

  if (bookings.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        No bookings yet. They&apos;ll show up here once customers can book online.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Needs your response</h2>
          {pending.map((b) => (
            <div key={b.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{b.serviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.customerName} · {dayLabel(b.startAt)} at {formatTime(b.startAt)}
                  </p>
                  {b.customerContact && <p className="text-sm text-muted-foreground">{b.customerContact}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">Pending</Badge>
                  {b.rescheduledAt && <Badge variant="outline">Rescheduled</Badge>}
                </div>
              </div>
              <Textarea
                placeholder="Message the customer (optional)"
                value={notes[b.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [b.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button className="flex-1" disabled={isPending} onClick={() => respond(b.id, "CONFIRMED")}>
                  Accept
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => respond(b.id, "DECLINED")}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      {upcomingGroups.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Confirmed</h2>
          {upcomingGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</p>
              {group.rows.map((b) => (
                <div key={b.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {formatTime(b.startAt)} · {b.serviceName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {b.customerName}
                        {b.customerContact && ` · ${b.customerContact}`}
                      </p>
                    </div>
                    <Badge>Confirmed</Badge>
                  </div>

                  {completingId === b.id ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        inputMode="decimal"
                        placeholder="Amount charged (AZN), optional"
                        value={prices[b.id] ?? ""}
                        onChange={(e) => setPrices((prev) => ({ ...prev, [b.id]: e.target.value }))}
                        className="h-10 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" disabled={isPending} onClick={() => complete(b.id)}>
                          Confirm completed
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setCompletingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="self-start" onClick={() => setCompletingId(b.id)}>
                      Mark as completed
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
