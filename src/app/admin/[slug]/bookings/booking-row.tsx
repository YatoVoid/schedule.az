"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { adminRespondToBookingAction, adminCompleteBookingAction } from "./actions";

export type AdminBookingRow = {
  id: string;
  serviceName: string;
  customerName: string;
  staffName: string;
  startAt: string;
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";
  rescheduledAt: string | null;
  priceAzn: string | null;
  note: string | null;
};

const STATUS_LABEL: Record<AdminBookingRow["status"], string> = {
  PENDING_CONFIRMATION: "Pending",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
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
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{booking.serviceName}</p>
          <p className="text-sm text-muted-foreground">
            {booking.customerName} with {booking.staffName}
          </p>
          <p className="text-sm text-muted-foreground">{new Date(booking.startAt).toLocaleString()}</p>
          {booking.priceAzn && <p className="text-sm text-muted-foreground">Charged {booking.priceAzn} AZN</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={booking.status === "CONFIRMED" || booking.status === "COMPLETED" ? "default" : "outline"}>
            {STATUS_LABEL[booking.status]}
          </Badge>
          {booking.rescheduledAt && <Badge variant="outline">Rescheduled</Badge>}
        </div>
      </div>

      {booking.note && (
        <p className="rounded-lg bg-muted p-2 text-sm">
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
            <Button size="sm" className="flex-1" disabled={isPending} onClick={() => respond("CONFIRMED")}>
              Accept
            </Button>
            <Button size="sm" variant="outline" className="flex-1" disabled={isPending} onClick={() => respond("DECLINED")}>
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
