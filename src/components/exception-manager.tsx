"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/app/login/actions";

export type ExceptionRow = {
  id: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  type: "BUSY" | "FREE";
  recurringAnnually: boolean;
  label: string | null;
};

export type ExceptionFormState = {
  startDate: string;
  endDate: string;
  type: "BUSY" | "FREE";
  recurringAnnually: boolean;
  label: string;
};

function todayIso() {
  return dateToIso(new Date());
}

// Local calendar-day helpers (no UTC conversion), a Date here always means a
// specific day, never a point in time, so this avoids the classic "date
// shifts by one" bug from mixing toISOString() with local Date objects.
function dateToIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isoToDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatRange(startDate: string, endDate: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = isoToDate(startDate).toLocaleDateString(undefined, opts);
  if (startDate === endDate) return start;
  const end = isoToDate(endDate).toLocaleDateString(undefined, opts);
  return `${start} to ${end}`;
}

function ExceptionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial: ExceptionFormState;
  submitLabel: string;
  onSubmit: (state: ExceptionFormState) => void;
  onCancel?: () => void;
  isPending: boolean;
}) {
  const [state, setState] = useState(initial);

  return (
    <div className="flex flex-col gap-4">
      <Calendar
        mode="range"
        selected={{ from: isoToDate(state.startDate), to: isoToDate(state.endDate) }}
        onSelect={(range) => {
          if (!range?.from) return;
          setState((s) => ({
            ...s,
            startDate: dateToIso(range.from!),
            endDate: dateToIso(range.to ?? range.from!),
          }));
        }}
        className="self-center rounded-xl border"
      />

      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <Select value={state.type} onValueChange={(v) => v && setState((s) => ({ ...s, type: v as "BUSY" | "FREE" }))}>
          <SelectTrigger className="h-10 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BUSY">Busy</SelectItem>
            <SelectItem value="FREE">Free</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {state.type === "BUSY" ? "Not bookable on these days." : "Opens a day that's normally closed."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Repeats every year</p>
          <p className="text-xs text-muted-foreground">For fixed holidays, same dates each year</p>
        </div>
        <Switch
          checked={state.recurringAnnually}
          onCheckedChange={(v) => setState((s) => ({ ...s, recurringAnnually: v }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="exception-label">Label (optional)</Label>
        <Input
          id="exception-label"
          placeholder="Novruz holiday"
          value={state.label}
          onChange={(e) => setState((s) => ({ ...s, label: e.target.value }))}
          className="h-10 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSubmit(state)} disabled={isPending} className="h-11 flex-1 text-sm">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isPending} className="h-11 text-sm">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// Shared between a staff member's own dashboard and the admin's per-staff
// management page, actions are injected so each caller can scope them.
export function ExceptionManager({
  exceptions,
  onAdd,
  onUpdate,
  onDelete,
}: {
  exceptions: ExceptionRow[];
  onAdd: (state: ExceptionFormState) => Promise<ActionResult>;
  onUpdate: (id: string, state: ExceptionFormState) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const blankForm: ExceptionFormState = {
    startDate: todayIso(),
    endDate: todayIso(),
    type: "BUSY",
    recurringAnnually: false,
    label: "",
  };

  function handleAdd(state: ExceptionFormState) {
    startTransition(async () => {
      const result = await onAdd(state);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Added");
    });
  }

  function handleUpdate(id: string, state: ExceptionFormState) {
    startTransition(async () => {
      const result = await onUpdate(id, state);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setEditingId(null);
      toast.success("Updated");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await onDelete(id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-4 text-sm font-medium">Add a day off, busy stretch, or yearly holiday</p>
        <ExceptionForm initial={blankForm} submitLabel="Add" onSubmit={handleAdd} isPending={isPending} />
      </div>

      <div className="flex flex-col gap-3">
        {exceptions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No exceptions set.</p>
        )}
        {exceptions.map((ex) =>
          editingId === ex.id ? (
            <div key={ex.id} className="rounded-xl border bg-card p-4">
              <p className="mb-4 text-sm font-medium">Edit</p>
              <ExceptionForm
                initial={{
                  startDate: ex.startDate,
                  endDate: ex.endDate,
                  type: ex.type,
                  recurringAnnually: ex.recurringAnnually,
                  label: ex.label ?? "",
                }}
                submitLabel="Save"
                onSubmit={(state) => handleUpdate(ex.id, state)}
                onCancel={() => setEditingId(null)}
                isPending={isPending}
              />
            </div>
          ) : (
            <div key={ex.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{ex.label || (ex.type === "BUSY" ? "Busy" : "Free")}</p>
                <p className="text-sm text-muted-foreground">
                  {formatRange(ex.startDate, ex.endDate)}
                  {ex.recurringAnnually ? ", every year" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={ex.type === "BUSY" ? "outline" : "default"}>
                  {ex.type === "BUSY" ? "Busy" : "Free"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(ex.id)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(ex.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
