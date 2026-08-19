# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two sides of the same directory:

- **Store owners/staff in Baku**: barbershops, salons, spas, tutoring centers, gyms. Currently run bookings informally over WhatsApp; this replaces that with phone-verified accounts, staff calendars, and confirmed bookings. Admins manage services, staff, and hours; staff manage only their own calendar.
- **Consumers in Baku** (plus some tourists without a local phone number): looking for a specific business or a specific professional they already see, browsing a directory of businesses to find and book. Book via a public store page, either found through the directory or shared directly (e.g. a business's Instagram bio link).

## Product Purpose

A multi-tenant booking platform and public directory for Baku service businesses. Gives store owners phone-verified accounts, staff calendars with real availability (weekly hours + one-off/annual exceptions), and SMS-confirmed bookings. Gives consumers a central place to find a business and book a real open slot, no back-and-forth over WhatsApp. Success is store owners trusting it enough to move their real booking flow off WhatsApp, and consumers finding and completing a booking without confusion.

## Positioning

Purpose-built for how Baku service businesses actually operate today (WhatsApp-based, phone-first, cash/in-person payment, price sometimes only discussed in-store) rather than a generic Western booking SaaS template. Phone-OTP is the primary login because that's the identity SMS reminders already go to and how these businesses already communicate with clients. A neighboring generic scheduling tool could not truthfully claim the same fit to this market's habits (phone-first identity, "price discussed in store" as a first-class option, staff-level bookability tied to actually-set hours).

## Operating Context

- Store admin/staff work from a dashboard: bookings queue (needs-response / needs-completion / upcoming / past), staff roster, per-staff calendar with color-coded time-off, service list, and analytics (revenue from actually-charged amounts, top repeat customers).
- Consumers browse the homepage directory (search + category filter), land on a public store page at `/{slug}`, book a service against real open slots, and manage bookings from `/account` (upcoming, favorites, past, reschedule/cancel).
- Declined/accepted bookings surface as an unread-style notification to the consumer until they open that tab.
- SMS and email are behind provider interfaces but currently console-log stubs in dev; no real vendor wired up yet.

## Capabilities and Constraints

- Next.js 16 (App Router) + TypeScript, Tailwind + shadcn/ui (Base UI primitives), Postgres via Prisma 6, iron-session cookies, zod validation.
- Phone-first OTP auth; email-OTP is the fallback identity, mainly for tourists booking as consumers.
- A staff member is only bookable once they have actual working hours set; being an admin/owner does not make someone bookable by itself.
- Only one logo image exists per store today (`storage/logos/{id}`, served via `src/app/api/logos/[storeId]/route.ts`); there is no multi-photo gallery yet. This design pass adds one: business owners will be able to upload multiple photos of their business, cycling as a carousel on their homepage directory card, framed like scanning listings on a map app to pick the right business.
- Not built yet: real SMS/WhatsApp vendor, payment collection, add-to-calendar (.ics) export, an Instagram-style account-creation step (choose a username, add a profile picture — accounts currently have neither), and a dedicated mobile-friendliness audit across every surface (consumer directory, booking flow, admin/staff dashboards).
- No formal test runner; `scripts/` holds standalone `npx tsx scripts/<name>.ts` checks run against a local database.

## Brand Commitments

- Name: Schedule.az. No logo/wordmark asset exists yet (`public/` only has unused default Next.js starter SVGs) — the product identity is effectively unset going into this design pass.
- No existing visual identity is binding. The current UI is the stock shadcn/base-ui default theme (green/gray, Geist Sans), produced by an earlier AI pass with no deliberate design decisions behind it. Treat it as evidence of layout/functionality only, not as an aesthetic to preserve. `CLAUDE.md`'s design policy names a warm amber/terracotta palette that was never actually implemented anywhere in the code; it's a stale/aspirational note from that same earlier pass, not a constraint.
- UI copy is English only for this pass. Store names, categories, and descriptions are often Azerbaijani or Russian (Cyrillic + Azerbaijani diacritics), entered by real business owners — typography must render both cleanly even though UI chrome stays English.

## Evidence on Hand

- No real store photos exist yet; the gallery/carousel feature ships ahead of that content. Card design for a store with zero uploaded photos must not fabricate imagery (no stock photos, no generic illustration standing in for a real business) — falls back to the existing logo/initials avatar treatment, same as today, until the owner uploads at least 2 photos.
- No real user testimonials, usage stats, or customer logos exist. None may be invented for any surface.

## Product Principles

1. Fit Baku's actual business habits (phone-first, in-person price/payment norms) over copying generic Western SaaS booking-tool conventions.
2. Never fabricate content: no invented stats, testimonials, stock photography standing in for a real business, or placeholder-shaped copy that isn't true yet.
3. The directory's homepage is a discovery surface, not just a list: it should let a consumer visually recognize and compare real businesses (photos, name, what they do) the way a map app's place cards do, to make picking the right one easier.
4. Only bookable, real capacity is shown to consumers (a staff member with no set hours isn't presented as available).
5. The design system established now must scale cleanly to many more stores and future admin/staff surfaces, not just look right on the one homepage it starts with.

## Accessibility & Inclusion

No product-specific accessibility requirement has been confirmed beyond standard web accessibility practice.
