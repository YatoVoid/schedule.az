// Fixed knobs for the reminder pipeline. Kept together so the abuse/cost
// ceilings are all visible in one place.

// Morning-of appointment nudge: aim for this Baku hour, but never later
// than MIN_LEAD_MS before the appointment itself.
export const APPOINTMENT_HOUR_BAKU = 8;
export const APPOINTMENT_MIN_LEAD_MS = 2 * 60 * 60 * 1000;

// Win-back nudge: send around this Baku hour on its due day, never at 4am.
export const WINBACK_HOUR_BAKU = 10;

// A due reminder more than this stale is dropped unsent rather than fired
// late (server was down for a long stretch, etc.). One day of slack.
export const MAX_SEND_DELAY_MS = 24 * 60 * 60 * 1000;

// Provider-error retry budget per reminder before it is parked as FAILED.
export const MAX_ATTEMPTS = 3;

// Ceilings enforced at send time. Per run bounds provider spend on any one
// tick; per-user/day is a blast-radius cap if a store mass-books one
// customer; win-back per-user/window makes "at most one nudge, then quiet"
// hold even across different stores.
export const MAX_SENDS_PER_RUN = 200;
export const MAX_MESSAGES_PER_USER_PER_DAY = 5;
export const WINBACK_PER_USER_WINDOW_DAYS = 7;
export const WINBACK_MAX_PER_USER_PER_WINDOW = 1;

// Background loop cadence (src/instrumentation.ts).
export const SEND_TICK_MS = 60 * 1000;
export const PLAN_EVERY_TICKS = 15;

// Advisory-lock key so the in-process loop and the HTTP trigger can never
// run the pipeline concurrently. Arbitrary constant, unique to this app.
export const REMINDER_ADVISORY_LOCK_KEY = 748213905;
