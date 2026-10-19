"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { formatBookingTime } from "@/lib/baku-time";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};
import { adminRespondToBookingAction, adminCompleteBookingAction } from "./actions";

export type AdminBookingRow = {
  id: string;
  serviceName: string;
  customerName: string;
  customerContact: string | null;
  staffName: string;
  startAt: string;
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";
  rescheduledAt: string | null;
  priceAzn: string | null;
  note: string | null;
};

export function AdminBookingRow({
  slug,
  booking,
  showActions,
}: {
  slug: string;
  booking: AdminBookingRow;
  showActions: "respond" | "complete" | "none";
}) {
  const [completing, setCompleting] = useState(false);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function respond(status: "CONFIRMED" | "DECLINED") {
    startTransition(async () => {
      const result = await adminRespondToBookingAction(slug, booking.id, status, note);
      if (!result.ok) toast.error(result.error);
    });
  }

  function complete() {
    startTransition(async () => {
      const result = await adminCompleteBookingAction(slug, booking.id, price);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCompleting(false);
      toast.success("Marked as completed");
    });
  }

  return (
    <div className="surface flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{booking.serviceName}</p>
          <p className="text-sm text-muted-foreground">
            {booking.customerName} with {booking.staffName}
          </p>
          {booking.customerContact && (
            <p className="text-sm text-muted-foreground">{booking.customerContact}</p>
          )}
          <p className="font-mono text-xs text-muted-foreground">{formatBookingTime(booking.startAt, DATE_FORMAT)}</p>
          {booking.priceAzn && <p className="text-sm text-muted-foreground">Charged {booking.priceAzn} AZN</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusPill status={booking.status} />
          {booking.rescheduledAt && <Badge variant="outline">Rescheduled</Badge>}
        </div>
      </div>

      {booking.note && (
        <p className="rounded-lg bg-sage-soft p-3 text-sm">
          <span className="font-medium">Note: </span>
          {booking.note}
        </p>
      )}

      {showActions === "respond" && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Message the customer (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="blossom" className="h-9 flex-1" disabled={isPending} onClick={() => respond("CONFIRMED")}>
              Accept
            </Button>
            <Button variant="outline" className="h-9 flex-1" disabled={isPending} onClick={() => respond("DECLINED")}>
              Decline
            </Button>
          </div>
        </div>
      )}

      {showActions === "complete" &&
        (completing ? (
          <div className="flex flex-col gap-2">
            <Input
              inputMode="decimal"
              placeholder="Amount charged (AZN), optional"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" disabled={isPending} onClick={complete}>
                Confirm completed
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCompleting(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="self-start" onClick={() => setCompleting(true)}>
            Mark as completed
          </Button>
        ))}
    </div>
  );
}
