# Schedule.az

Multi-tenant booking platform + directory for Baku service businesses (barbershops, salons, spas, tutoring centers, gyms). Replaces informal per-master WhatsApp booking with phone-verified accounts, staff calendars, SMS-confirmed bookings, and a central discovery directory.

**Store side**: phone-OTP login, onboarding, service management (with optional "price discussed in store"), staff invites (as admin or staff), per-staff weekly hours + one-off/annual time-off exceptions with a color-coded calendar, booking accept/decline/complete (with the actual amount charged captured on completion, separate from a service's listed price), rescheduled bookings flagged for staff, admin bookings page split into needs-response/needs-completion/upcoming/past, a shareable public booking link, and real analytics (revenue from actual charged amounts, a full staff roster with this-month booking counts, top repeat customers, all computed from real data, no invented numbers).

Only staff who've actually set working hours show up as bookable, being an admin/owner doesn't make someone bookable by itself.

**Consumer side**: a public store page at `/{slug}` (e.g. `/kingston-test`) that's also the link businesses share on Instagram, a real booking engine (`src/lib/schedule.ts`, `src/lib/booking-slots.ts`) that computes actual open time slots *and* which calendar days have any opening at all (so the customer never clicks through empty days), inline phone/email OTP + name collection during the first booking (no separate signup step, name changeable later from the account page), and a `/account` area (upcoming, favorites, past, with reschedule/cancel). Declined or accepted bookings surface as an unread-style notification, with the staff's message, until the customer actually opens that tab. The directory homepage (`/`) lists every store with search (business name, category, or staff name) and a category filter.

Not built yet: a real SMS/WhatsApp vendor (currently console-log stubs), payment collection, add-to-calendar (.ics) export, an Instagram-style signup step (username + profile picture, currently accounts have neither), and a pass to confirm every page is actually mobile-friendly rather than just responsive by default.

## Stack

Next.js 16 (App Router) + TypeScript, Tailwind + shadcn/ui (Base UI primitives), Postgres via Prisma 6, OTP auth with iron-session cookies, zod validation. Login is phone-first (matches how local businesses operate and is what SMS reminders go to), with email-OTP as a secondary identity for people without an Azerbaijani number, mainly tourists booking as consumers ("Don't have a phone number?" on the login screen). Both SMS and email are behind provider interfaces (`src/lib/sms.ts`, `src/lib/email.ts`), currently console-log stubs since no vendor is selected yet; swapping in a real one is a one-file change each.

## Local development

```bash
docker compose up -d        # Postgres on localhost:5433
cp .env.example .env        # then set SESSION_SECRET to a random 32+ byte hex string
npm install
npx prisma migrate deploy
npm run dev
```

App runs at `http://localhost:3000`. In dev, OTP codes are printed to the server console instead of sent as SMS (`[sms:dev] to=... message="..."`).

**Quick manual testing**: on `/login`, phone `0000` with code `0000` always logs in, no real OTP needed, any bare 4-digit phone works the same way with code `0000`. This bypass only works when `NODE_ENV` is not `production` (see `src/lib/otp.ts`), so it can't leak into a real deployment.

To try the app with a working store already set up:

```bash
npx tsx scripts/seed-test-accounts.ts
```

Then log in at `/login` with phone `0000`, code `0000`, to land on the admin dashboard for the seeded store. Log out and back in as `0001` for the staff view, or `0002` (via "Log in" on the homepage, not "I run a business") for a plain consumer account.

- `npm run typecheck`, TypeScript
- `npm run lint`, ESLint
- `npm run db:studio`, browse the database

There's no formal test runner configured yet, `scripts/` holds a set of standalone checks instead, each run with `npx tsx scripts/<name>.ts` against your local database:

- `seed-test-accounts.ts`, sets up phone `0000` as a store admin, `0001` as staff on that store, `0002` as a plain consumer (see the walkthrough above)
- `verify-flow.ts`, seeds a demo store/staff/booking and prints sealed session cookies, for exercising the admin/staff dashboards without OTP by hand
- `verify-phone-login.ts` / `verify-email-login.ts`, OTP round trip (send, wrong code rejected, correct code accepted, replay rejected, rate limit)
- `verify-dev-test-phone.ts`, the `0000`-style dev login bypass
- `verify-exception-edit.ts`, staff time-off exceptions (add, edit, annual recurrence)
- `verify-available-days.ts`, which calendar days actually have openings, weekly hours + exceptions + existing bookings combined
- `verify-consumer-flow.ts`, the booking engine end to end, slot computation through booking creation
- `verify-reschedule-cancel.ts` / `verify-completion-flow.ts`, rescheduling, cancelling, and marking a booking complete with a charged amount
- `verify-admin-edits-staff.ts`, admin editing another staff member's name/hours/exceptions

## Notes carried from the business plan

Pricing, SMS cost strategy, legal payment routing, and hosting decisions are tracked outside this repo (project memory), not duplicated here since they change independently of the code.
