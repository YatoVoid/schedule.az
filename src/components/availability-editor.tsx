"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TimeSelect } from "@/components/time-select";
import type { ActionResult } from "@/app/login/actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayState = { open: boolean; startMinute: number; endMinute: number };

export type SetAvailabilityInput = {
  dayOfWeek: string;
  open: boolean;
  startMinute: string;
  endMinute: string;
};

// Shared between a staff member's own dashboard and the admin's per-staff
// management page, the save action is injected so each caller can scope it
// (to "my own calendar" vs "this specific staff member") without this
// component needing to know which.
export function AvailabilityEditor({
  initial,
  onSave,
}: {
  initial: Record<number, { startMinute: number; endMinute: number } | undefined>;
  onSave: (input: SetAvailabilityInput) => Promise<ActionResult>;
}) {
  const [days, setDays] = useState<DayState[]>(() =>
    DAYS.map((_, i) => {
      const existing = initial[i];
      return {
        open: !!existing,
        startMinute: existing?.startMinute ?? 540, // 9:00 AM
        endMinute: existing?.endMinute ?? 1080, // 6:00 PM
      };
    }),
  );
  const [isPending, startTransition] = useTransition();

  function save(dayIndex: number, next: DayState) {
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? next : d)));
    startTransition(async () => {
      const result = await onSave({
        dayOfWeek: String(dayIndex),
        open: next.open,
        startMinute: String(next.startMinute),
        endMinute: String(next.endMinute),
      });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border bg-card">
      {DAYS.map((label, i) => {
        const day = days[i];
        return (
          <div key={label} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id={`day-${i}`}
                checked={day.open}
                disabled={isPending}
                onCheckedChange={(checked) => save(i, { ...day, open: checked })}
              />
              <Label htmlFor={`day-${i}`} className="w-24 font-medium">
                {label}
              </Label>
            </div>
            {day.open && (
              <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
                <TimeSelect
                  minutes={day.startMinute}
                  onChange={(startMinute) => save(i, { ...day, startMinute })}
                />
                <span className="text-muted-foreground">to</span>
                <TimeSelect
                  minutes={day.endMinute}
                  onChange={(endMinute) => save(i, { ...day, endMinute })}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
