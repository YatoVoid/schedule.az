"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { AddToCalendar } from "@/components/add-to-calendar";
import { dateToIso, isoToDate, formatMinutes } from "@/lib/schedule";
import { sendOtpAction, verifyOtpAction, type LoginMethod } from "@/app/login/actions";
import {
  getAvailableDatesAction,
  getAvailableSlotsAction,
  getCurrentUserBriefAction,
  setNameAction,
  createBookingAction,
} from "./actions";

const DATE_WINDOW_DAYS = 90;

type Professional = { id: string; name: string };
type Service = { id: string; name: string; durationMin: number; priceAzn: string | null };
type CurrentUser = { id: string; name: string | null; phone: string | null; email: string | null };

type Step = "professional" | "service" | "datetime" | "contact" | "done";

export function BookingFlow({
  storeSlug,
  storeName,
  storeAddress,
  professionals,
  services,
  initialUser,
}: {
  storeSlug: string;
  storeName: string;
  storeAddress: string | null;
  professionals: Professional[];
  services: Service[];
  initialUser: CurrentUser | null;
}) {
  const [step, setStep] = useState<Step>("professional");
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [slotsResult, setSlotsResult] = useState<{ key: string; slots: number[] } | null>(null);
  const [datesResult, setDatesResult] = useState<{ key: string; dates: Set<string> } | null>(null);
  const [startMinute, setStartMinute] = useState<number | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: string; startAt: string; endAt: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const dateRef = useRef(date);
  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const selectedProfessional = professionals.find((p) => p.id === professionalId) ?? null;

  const slotsKey = professionalId && serviceId ? `${professionalId}:${serviceId}:${dateToIso(date)}` : null;
  const slots = slotsResult && slotsResult.key === slotsKey ? slotsResult.slots : null;

  const datesKey = professionalId && serviceId ? `${professionalId}:${serviceId}` : null;
  const availableDates = datesResult && datesResult.key === datesKey ? datesResult.dates : null;

  useEffect(() => {
    if (step !== "datetime" || !slotsKey || !professionalId || !serviceId) return;
    let cancelled = false;
    getAvailableSlotsAction(professionalId, serviceId, dateToIso(date)).then((result) => {
      if (cancelled) return;
      setSlotsResult({ key: slotsKey, slots: result.ok ? result.slots : [] });
    });
    return () => {
      cancelled = true;
    };
  }, [step, slotsKey, professionalId, serviceId, date]);

  // Which days to even let the customer click, computed once per
  // professional+service pick (not per day), so the calendar shows real
  // options up front instead of the customer clicking through empty days.
  useEffect(() => {
    if (step !== "datetime" || !datesKey || !professionalId || !serviceId) return;
    let cancelled = false;
    const from = dateToIso(new Date());
    const to = dateToIso(new Date(Date.now() + DATE_WINDOW_DAYS * 24 * 60 * 60 * 1000));
    getAvailableDatesAction(professionalId, serviceId, from, to).then((result) => {
      if (cancelled) return;
      const dates = result.ok ? result.dates : [];
      setDatesResult({ key: datesKey, dates: new Set(dates) });
      // Land the customer on a real bookable day instead of "today" if
      // today happens to be closed, that's the whole point of computing
      // this up front rather than making them click through blind.
      if (dates.length > 0 && !dates.includes(dateToIso(dateRef.current))) {
        setDate(isoToDate(dates[0]));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step, datesKey, professionalId, serviceId]);

  function handleConfirm() {
    if (!professionalId || !serviceId || startMinute === null) return;
    startTransition(async () => {
      const result = await createBookingAction(storeSlug, professionalId, serviceId, dateToIso(date), startMinute);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.bookingId && result.startAt && result.endAt) {
        setConfirmedBooking({ id: result.bookingId, startAt: result.startAt, endAt: result.endAt });
      }
      setStep("done");
    });
  }

  if (professionals.length === 0 || services.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        This business hasn&apos;t set up online booking yet.
      </p>
    );
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-8 text-center">
        <p className="text-lg font-medium">Request sent</p>
        <p className="text-sm text-muted-foreground">
          {selectedProfessional?.name} will confirm your {selectedService?.name} on{" "}
          {date.toLocaleDateString(undefined, { month: "long", day: "numeric" })} at{" "}
          {startMinute !== null && formatMinutes(startMinute)}.
        </p>
        {confirmedBooking && (
          <div className="mt-1 w-full">
            <AddToCalendar
              bookingId={confirmedBooking.id}
              title={`${selectedService?.name ?? "Appointment"} at ${storeName}`}
              description={`Booked via Schedule.az with ${selectedProfessional?.name ?? "staff"}`}
              location={storeAddress}
              startAt={confirmedBooking.startAt}
              endAt={confirmedBooking.endAt}
            />
          </div>
        )}
        <Button render={<Link href="/account" />} nativeButton={false} className="mt-2 h-11">
          View my bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <Stepper current={step} />

      {step === "professional" && (
        <div className="flex flex-col gap-2">
          {professionals.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProfessionalId(p.id);
                setStep("service");
              }}
              className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent"
            >
              <Avatar>
                <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {step === "service" && (
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServiceId(s.id);
                setStep("datetime");
              }}
              className="flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.durationMin} min</p>
              </div>
              <span className="shrink-0 text-sm font-medium">
                {s.priceAzn ? `${s.priceAzn} AZN` : "Discussed in store"}
              </span>
            </button>
          ))}
          <BackButton onClick={() => setStep("professional")} />
        </div>
      )}

      {step === "datetime" && (
        <div className="flex flex-col gap-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (!d) return;
              setDate(d);
              setStartMinute(null);
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
                <Button
                  key={m}
                  variant={startMinute === m ? "default" : "outline"}
                  className="h-10 text-sm"
                  onClick={() => {
                    setStartMinute(m);
                    setStep("contact");
                  }}
                >
                  {formatMinutes(m)}
                </Button>
              ))}
            </div>
          )}
          <BackButton onClick={() => setStep("service")} />
        </div>
      )}

      {step === "contact" && (
        <ContactStep
          user={user}
          summary={{
            professional: selectedProfessional?.name ?? "",
            service: selectedService?.name ?? "",
            price: selectedService?.priceAzn ?? null,
            date,
            startMinute,
          }}
          onLoggedIn={setUser}
          onConfirm={handleConfirm}
          onBack={() => setStep("datetime")}
          isPending={isPending}
        />
      )}
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "professional", label: "Professional" },
    { key: "service", label: "Service" },
    { key: "datetime", label: "Time" },
    { key: "contact", label: "Confirm" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {steps.map((s, i) => (
        <span key={s.key} className={i <= currentIndex ? "font-medium text-foreground" : ""}>
          {s.label}
          {i < steps.length - 1 && <span className="mx-1.5">→</span>}
        </span>
      ))}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="self-start text-sm text-muted-foreground underline underline-offset-4">
      Back
    </button>
  );
}

function ContactStep({
  user,
  summary,
  onLoggedIn,
  onConfirm,
  onBack,
  isPending,
}: {
  user: CurrentUser | null;
  summary: { professional: string; service: string; price: string | null; date: Date; startMinute: number | null };
  onLoggedIn: (user: CurrentUser) => void;
  onConfirm: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [phase, setPhase] = useState<"identifier" | "code" | "name">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const needsName = user !== null && !user.name;
  const isDevBypass =
    process.env.NODE_ENV !== "production" && method === "phone" && /^\d{4}$/.test(identifier.trim());

  function sendCode() {
    setError(null);
    startTransition(async () => {
      const result = await sendOtpAction(method, identifier);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPhase("code");
    });
  }

  function verify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(method, identifier, code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const fresh = await getCurrentUserBriefAction();
      if (!fresh) {
        setError("Something went wrong. Try again.");
        return;
      }
      if (!fresh.name) {
        setPhase("name");
        return;
      }
      onLoggedIn(fresh);
    });
  }

  function saveName() {
    setError(null);
    startTransition(async () => {
      const result = await setNameAction(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const fresh = await getCurrentUserBriefAction();
      if (fresh) onLoggedIn(fresh);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="font-medium">{summary.service}</p>
        <p className="text-muted-foreground">
          with {summary.professional} · {summary.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}{" "}
          {summary.startMinute !== null && `at ${formatMinutes(summary.startMinute)}`}
        </p>
        <p className="text-muted-foreground">{summary.price ? `${summary.price} AZN` : "Price discussed in store"}</p>
      </div>

      {user && !needsName ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Booking as {user.name}</p>
          <Button onClick={onConfirm} disabled={isPending} className="h-12 text-base">
            {isPending ? "Booking..." : "Confirm booking"}
          </Button>
        </div>
      ) : needsName || phase === "name" ? (
        <div className="flex flex-col gap-3">
          <Label htmlFor="booking-name">Your name</Label>
          <Input
            id="booking-name"
            placeholder="First and last name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 text-base"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={saveName} disabled={busy || name.trim().length < 2} className="h-12 text-base">
            Continue
          </Button>
        </div>
      ) : phase === "identifier" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Verify your {method === "phone" ? "phone" : "email"} to book.</p>
          <Label htmlFor="booking-identifier">{method === "phone" ? "Phone number" : "Email address"}</Label>
          <Input
            id="booking-identifier"
            inputMode={method === "phone" ? "tel" : "email"}
            placeholder={method === "phone" ? "050 123 45 67" : "you@example.com"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="h-12 text-base"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={sendCode}
            disabled={busy || (!isDevBypass && identifier.trim().length < 5)}
            className="h-12 text-base"
          >
            Send code
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-4"
            onClick={() => setMethod(method === "phone" ? "email" : "phone")}
          >
            {method === "phone" ? "Don't have a phone number?" : "Use a phone number instead"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Label htmlFor="booking-code">Enter the 6-digit code</Label>
          <Input
            id="booking-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="h-12 text-base tracking-[0.3em]"
            placeholder={isDevBypass ? "0000" : undefined}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={verify}
            disabled={busy || (isDevBypass ? code !== "0000" : code.length !== 6)}
            className="h-12 text-base"
          >
            Verify
          </Button>
        </div>
      )}

      <BackButton onClick={onBack} />
    </div>
  );
}
