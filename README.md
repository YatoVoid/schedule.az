# Schedule.az

Multi-tenant booking platform + directory for Baku service businesses (barbershops, salons, spas, tutoring centers, gyms). Replaces informal per-master WhatsApp booking with phone-verified accounts, staff calendars, SMS-confirmed bookings, and a central discovery directory.

**Store side**: phone-OTP login, onboarding, service management (with optional "price discussed in store"), staff invites (as admin or staff), per-staff weekly hours + one-off/annual time-off exceptions with a color-coded calendar, booking accept/decline/complete (with the actual amount charged captured on completion, separate from a service's listed price), rescheduled bookings flagged for staff, admin bookings page split into needs-response/needs-completion/upcoming/past, a shareable public booking link, and real analytics (revenue from actual charged amounts, a full staff roster with this-month booking counts, top repeat customers, all computed from real data, no invented numbers).

Only staff who've actually set working hours show up as bookable, being an admin/owner doesn't make someone bookable by itself.

**Consumer side**: a public store page at `/{slug}` (e.g. `/kingston-test`) that's also the link businesses share on Instagram, a real booking engine (`src/lib/schedule.ts`, `src/lib/booking-slots.ts`) that computes actual open time slots *and* which calendar days have any opening at all (so the customer never clicks through empty days), inline phone/email OTP + name collection during the first booking (no separate signup step, name changeable later from the account page), and a `/account` area (upcoming, favorites, past, with reschedule/cancel). Declined or accepted bookings surface as an unread-style notification, with the staff's message, until the customer actually opens that tab. The directory homepage (`/`) lists every store with search (business name, category, or staff name) and a category filter.

Every login now routes a username-less account through `/profile-setup` (username + optional profile photo, Instagram-style) before it reaches its normal destination; `username`/`avatarMimeType`/`avatarUpdatedAt` live on `User`, avatar bytes on disk at `storage/avatars/{id}` same as store logos.

The homepage directory has one combined "Filters" button (`src/components/directory-filters.tsx`), Wolt-style: sort by newest, closest-to-you (browser geolocation, Haversine distance against each store's saved coordinates), or best reviews, plus a category filter, all in one popover instead of three separate controls.

The directory also renders a sticky Leaflet + OpenStreetMap panel (`src/components/directory-map.tsx`) next to the store list, with numbered pins (in each store's category color) matched to numbered list cards; on mobile the map opens as a full-screen dialog instead, and it's always rendered, even with zero results. List cards show a description, up to 3 services with price/duration, a rating pill, and a favorite-heart toggle. Clicking a pin opens a rich popup (photo, price-from, rating, services, "Open salon page").

The store detail page (`/{slug}`) is a two-column layout at desktop widths: a sticky "book right here" rail beside the scrolling content, instead of the booking flow being a separate step scrolled far below the fold. The photo gallery shows a large photo + 2×2 grid with a "See all photos" dialog on wider screens; mobile keeps the original single-frame carousel.

`/login` is a split-screen layout on desktop (madder-red brand panel with real value-prop copy, OTP form on the right, every input icon-prefixed), collapsing on mobile to a centered logo above the form. A persistent mobile bottom tab bar (Home/Search/Bookings/Favorites/Profile) now runs across every consumer-facing page, hidden on admin/staff dashboards and auth/onboarding screens.

See `REDESIGN.md` for the full sira.az-benchmarked brief (now fully shipped) and the one remaining open question: how much of this should extend to the admin/staff dashboards, which has no external reference to benchmark against.

The real logo is processed and wired in: a transparent-background circular mark (`public/logo-mark.png`) next to the wordmark in the header/login, and a circular favicon (`src/app/icon.png`).

Ratings and reviews are built, with equal treatment for every rating. A rater always picks 1-5 stars plus an optional comment on the store detail page, gated on having an actual completed booking there. Every rating is saved and shown to that store's admins at `/admin/[slug]/reviews` (name, phone/email, rating, comment) and counts toward the store's public average/count, regardless of the number. Posting on Google is a separate, always-offered choice after submitting — the same "Also post this rating on Google" link appears no matter how positive or negative the rating was, never routed by sentiment. Store owners set their Google review link from `/admin/[slug]/settings`.

One account can now own more than one business — `/onboarding` always offers "Add another business" instead of blocking a second `ADMIN` membership, and the dashboard nav's business switcher already supported multiple owned businesses.

Add-to-calendar is built (`src/lib/calendar-links.ts`): a fresh booking confirmation and any confirmed upcoming booking in `/account` show "Add to Google Calendar" (a direct link, no file to download) and "Add to Apple Calendar" (`/api/bookings/[bookingId]/calendar.ics`, opens the native iOS Add Event sheet rather than downloading). Both carry the store name, time, and address; the Apple/ICS version also carries a fixed 8:00 AM Baku-time reminder on the day of the appointment (an absolute ICS alarm, not "N hours before") — Google Calendar's simple add-link has no equivalent, so a Google-added event just uses that account's own default reminder.

Reminders are built (`src/lib/reminders/`). An in-process loop started from `src/instrumentation.ts` plans and sends two kinds of message:

- **Appointment reminder** — one nudge on the morning of a confirmed booking (08:00 Baku, or two hours before an early appointment), carrying the shop name and description, the staff member, date and time, address, and a Google Maps link. Transactional, always sent.
- **Win-back reminder** — after a completed visit, one "time to come back" nudge timed to that business type's average return interval (`src/lib/return-cadence.ts`, e.g. barber 21d, hair salon 42d, nails 14d). Each completed visit re-arms exactly one outstanding nudge; sending it does not re-arm without another visit, so a lapsed customer gets one message, not a monthly drip. Suppressed if the customer already has an upcoming booking there or has used the stop link (`User.winbackOptOut`, one-tap at `/u/[token]`).

Channel follows the account's contact details: a phone number means SMS only (even if an email is also set); email-only accounts get email. Caps: at most 5 reminder messages per user per day, at most one win-back per user per 7 days across all shops, 200 sends per cycle, 3 provider retries then parked. Delivery goes through the same `src/lib/sms.ts` / `src/lib/email.ts` providers as OTP, so without a real SMS vendor the SMS side is still a console stub. `POST /api/cron/run-reminders` (bearer `CRON_SECRET`) runs the same cycle on demand.

Not built yet: a real SMS/WhatsApp vendor (currently a console-log stub), payment collection.

Same-name-business disambiguation now covers the "neither has an address" case too. `Store.phone` is a real, owner-settable field (onboarding + `/admin/[slug]/settings`, shown on the public store page) — previously in the schema but never actually collected anywhere. The directory's disambiguator cascades address → phone → the store's own unique slug (`@store-slug`), so two same-named businesses always show genuinely different text, never both falling back to the same generic placeholder. The creation/rename nudge toast (`src/lib/duplicate-name.ts`) now only fires when both address and phone are blank.

Mobile-friendliness audit is done. Admin/staff dashboards were measured at 390px for overflow and touch-target size (consumer pages were already covered by the redesign). Fixed: the dashboard nav's tab row now fades at its edge to signal it scrolls (it already did, silently, once a 6th tab stopped fitting); an undersized gallery "Remove" button was brought up to this app's normal minimum size. Nothing else needed fixing — no page had horizontal overflow. One thing flagged, not changed: most buttons app-wide sit under the 44×44px touch-target guideline, which is a deliberate compact-density choice baked into the shared `Button` component, not a bug — changing it would be a design-system-wide call that needs an explicit ask, not something to do as a side effect of an audit.

## Stack

Next.js 16 (App Router) + TypeScript, Tailwind + shadcn/ui (Base UI primitives), Postgres via Prisma 6, OTP auth with iron-session cookies, zod validation. Login is phone-first (matches how local businesses operate and is what SMS reminders go to), with email-OTP as a secondary identity for people without an Azerbaijani number, mainly tourists booking as consumers ("Don't have a phone number?" on the login screen). SMS (`src/lib/sms.ts`) is still a console-log stub, no vendor picked yet. **Email (`src/lib/email.ts`) now has a real Resend provider wired in**, gated behind two env vars (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) — unset (the default), it keeps printing codes to the console exactly as before; set both and it sends real email. `RESEND_FROM_EMAIL` has to be on a domain verified in the Resend dashboard (SPF/DKIM records added there) or delivery silently only reaches the account owner's own inbox. On the server these two are held as GitHub Actions secrets and written into `.env` by the deploy workflow.

Booking times are stored UTC-labeled but their digits are Baku wall-clock (AZT, UTC+4, no DST); `src/lib/baku-time.ts` holds the conversion used by the calendar files and the reminder scheduler.

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

- `seed-test-accounts.ts`, sets up phone `0000` as a store admin, `0001` as staff on that store (with Mon-Sat 09:00-18:00 hours and two services), `0002` as a plain consumer (see the walkthrough above) — the store is actually bookable right after running this, not just a placeholder
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
