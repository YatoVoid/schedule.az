// How long, on average, before a customer of a given kind of business books
// again. Used to time the "time to come back" win-back reminder.
//
// These are industry rules of thumb, not measured from this app's data:
//   - Barbershop: men's cuts run down in about 2-4 weeks -> 21 days
//   - Hair salon: colour/longer-cut maintenance cycle -> 6 weeks
//   - Beauty salon: brows/lashes/general upkeep -> 4 weeks
//   - Nail studio: gel/acrylic fill window -> 2 weeks
//   - Massage / physio: a monthly maintenance rhythm is the common cadence
//   - Spa / facial: skin-cycle spacing is roughly 6-8 weeks
//   - Tattoo: not really recurring; a long gap avoids nagging
//   - Gym / tutoring: weekly, though these barely fit a "come back" nudge
// Anything unrecognised (freeform "Other" categories) gets a deliberately
// long default so we under-remind rather than pester.
//
// When per-store visit history is dense enough, this should be replaced by
// that store's own observed median gap between a returning customer's
// consecutive completed visits; resolveReturnIntervalDays is the single
// place that swap needs to happen.

const DEFAULT_INTERVAL_DAYS = 42;

const KEYWORD_INTERVALS: { match: RegExp; days: number }[] = [
  { match: /barber/, days: 21 },
  { match: /nail/, days: 14 },
  { match: /lash|brow|wax/, days: 28 },
  { match: /massage|physio|therap/, days: 30 },
  { match: /spa|facial|skin/, days: 49 },
  { match: /hair|salon/, days: 42 },
  { match: /beauty/, days: 28 },
  { match: /tattoo|piercing/, days: 180 },
  { match: /gym|fitness|yoga|pilates|train/, days: 7 },
  { match: /tutor|lesson|class|coach/, days: 7 },
];

export const MIN_RETURN_INTERVAL_DAYS = 7;
export const MAX_RETURN_INTERVAL_DAYS = 240;

export function resolveReturnIntervalDays(category: string): number {
  const normalized = category.trim().toLowerCase();
  for (const { match, days } of KEYWORD_INTERVALS) {
    if (match.test(normalized)) return days;
  }
  return DEFAULT_INTERVAL_DAYS;
}
