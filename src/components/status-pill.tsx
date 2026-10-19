import { cn } from "@/lib/utils";

export type BookingStatus = "PENDING_CONFIRMATION" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";

const LABEL: Record<BookingStatus, string> = {
  PENDING_CONFIRMATION: "Pending",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const TONE: Record<BookingStatus, string> = {
  PENDING_CONFIRMATION: "bg-coral/12 text-coral",
  CONFIRMED: "bg-sage text-primary",
  COMPLETED: "bg-primary text-primary-foreground",
  DECLINED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold",
        TONE[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}
