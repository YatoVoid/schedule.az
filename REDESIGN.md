# Redesign Notes: sira.az Benchmark

**Status: closed out 2026-08-21.** Directory + map (section 1), salon detail
page (section 2), register/login (section 3), and the mobile bottom tab
bar (from section 3's cross-cutting note) are all built. The admin/staff-
dashboard question (section 5) is resolved too: user's call was "if it
doesn't map cleanly, don't push" — most of this redesign genuinely doesn't
translate (no bottom tab bar there; an owner's Overview/Bookings/Services/
Staff/Reviews/Branding tabs don't correspond to Home/Search/Favorites/
Profile). An audit found and fixed two real, low-risk inconsistencies
instead of forcing a bigger pass: the dashboard header's store name now
uses the Unbounded display font (`src/components/dashboard-nav.tsx`,
matching every other store-name instance in the app, was plain
`font-semibold`), and the staff-invite phone/verification-code inputs
(`src/app/admin/[slug]/staff/staff-manager.tsx`) now carry the same
leading-icon treatment established in the login redesign. Nothing else in
this file remains open.

**Section 1 — directory + map.** The homepage renders a sticky Leaflet +
OpenStreetMap panel next to the store list, with numbered pins matched to
numbered list rows, richer list cards (description, up to 3 services with
duration/price, a favorite heart, a rating pill), a rich click-to-open map
popup, and a mobile "Map view" full-screen dialog in place of the
side-by-side split. The map is now always rendered, even with zero results.
See `src/components/directory-view.tsx`, `directory-map.tsx`, the rewritten
`store-panel.tsx`, and `src/lib/geo.ts`.

**Section 2 — salon detail page.** `src/app/[slug]/page.tsx` is now a
two-column layout at `lg+`: a scrolling left column (gallery, header,
description, map, services, reviews) beside a sticky right rail holding
the booking flow — the sira-style "choose services, book right here" panel
instead of a step scrolled far below the fold. Mobile stays single-column,
booking flow at the bottom, same relative order as before. The gallery
(`src/components/store-gallery.tsx`) gained a `sm+`-only large-photo +
2×2-grid layout with a "See all photos" overlay on the last tile opening a
full swipeable dialog; mobile keeps the original single-frame carousel,
there's no room for a grid there. Implementation note: the booking flow is
mounted exactly once (not duplicated per breakpoint) and repositioned via
CSS grid placement (`lg:col-start-2 lg:row-start-1`) — an earlier draft
nearly rendered two separate `BookingFlow` client instances (one per
breakpoint, hidden via CSS), which would have double-fired its internal
slot-fetching effects and let the two copies drift out of sync; caught and
fixed before shipping.

**Section 3 — register/login + mobile bottom nav.** `/login`
(`src/app/login/page.tsx`) is now a split-screen layout at `lg+`: a solid
madder-red brand panel (not sira's gradient — restrained, one hue, matches
the palette-family rule in `DESIGN.md`) with the logo mark in an ivory circular
chip, a real one-line value proposition ("Book your next appointment in
Baku." / "Barbershops, salons, spas and more, confirmed by SMS, no
back-and-forth over WhatsApp." — true today, not aspirational), top-left;
the OTP form on the right. Every input (phone, email, code) now has a
leading icon (`src/app/login/login-form.tsx`), matching sira's icon-in-
field treatment. Mobile collapses to a single column with the logo mark
centered above the wordmark, matching sira's mobile lockup exactly.
Password/confirm-password fields were correctly **not** copied — this
product is OTP-only by design, a difference documented as intentional in
the original brief, not a gap.

A persistent mobile bottom tab bar (`src/components/mobile-tab-bar.tsx`:
Home / Search / Bookings / Favorites / Profile) is now live, consumer-facing
routes only — hidden on `/admin`, `/staff`, `/onboarding`, `/login`, and
`/profile-setup`, which either have their own nav (`DashboardNav`) or are a
single-purpose screen. Search opens `/?focus=search` (autofocuses the
existing search input, not a separate search page); Bookings/Favorites deep
-link into `/account`'s tabs via a new `?tab=` param the page now reads.

**Decision recorded 2026-08-21**: kept instant-submit filtering (every
filter/sort change resubmits the page immediately) rather than switching to
sira's deferred Reset/Apply pattern. This closes that open question from
the original brief — deferred-apply is no longer a planned follow-up unless
revisited later.

**Implementation notes, decided while building:**
- Went with Leaflet + OpenStreetMap tiles (free, no API key), matching
  sira's actual stack exactly rather than introducing a paid Google Maps
  dependency the project has never needed.
- Kept the existing instant-submit filter drawer (Reset/Apply deferred-apply
  was in the original brief as "worth adopting" but not done this pass —
  still an open follow-up, not forgotten).
- District and "available today" filters were **not** added — there's no
  district field or real-time availability-per-store query backing them
  yet, and faking either would violate the "every claim on the page true
  right now" rule in `DESIGN.md`. Minimum-rating filter
  wasn't added either, for the same reason "Best reviews" sort is disabled.
- Stores without saved coordinates stay in the list (still numbered in
  sequence) but get no map pin — there's no forced/fake location.
- Custom numbered circular markers (Leaflet `divIcon`) draw in each store's
  category guard color, tying the map into the existing wayfinding system
  instead of introducing sira's plain orange pin color.
- List cards reuse a heart-icon favorite toggle (new `favorite-heart-button.tsx`,
  wired to the existing `toggleFavoriteAction`) that wasn't on the homepage
  before this pass, matching sira's card layout and completing the existing
  favorites feature's visibility.
- Map pins now open a rich popup on click (photo, numbered badge, name, "from
  X AZN" computed off the cheapest of that store's shown services, category
  chip, address, up to 2 service-name chips, an "Open salon page" button),
  matching the sira reference screenshot the user supplied. Required
  restyling Leaflet's own popup chrome via scoped `!important` overrides in
  `globals.css` (`.schedule-map-popup ...`) — Leaflet's stylesheet loads
  after ours since it's imported inside the dynamically-loaded map chunk, so
  plain specificity wasn't enough to win the cascade.

Recorded 2026-08-21. User pointed at [sira.az](https://sira.az) (a competing Baku
beauty-booking product) as a UI benchmark, specifically `/en/search` and
`/en/register`, and asked for a full redesign pass across every user type
(consumer, business owner, staff) once this is picked up. Nothing in this
file has been built yet — it's the brief for that future work, based on an
actual visual review of the live site (both desktop and mobile), not a guess
from the name alone.

**Scope note:** the goal is to steal sira's information architecture and
interaction patterns, not its skin. Schedule.az keeps its own palette
(warm ivory / madder red), type stack (Unbounded + Golos Text + Geist Mono),
and the woven guard-band motif from `DESIGN.md`. Sira's actual visual
language (a terracotta-to-orange gradient, black wordmark, plain white
cards) sits close enough to our color family that some cross-pollination is
fine, but this should read as Schedule.az getting better, not as a sira
reskin.

## 1. Directory / search page (`/en/search`)

Their layout, top to bottom:

- Announcement strip above the header ("Sira is still under active
  development..."), full-width, brand-colored.
- Header: wordmark left, nav (Services / Salons / For business) center-left,
  favorites icon + language switcher + Log in + Sign up right. Sign up is a
  filled button, Log in is plain text — clear primary/secondary weighting.
- One search bar directly under the header: a service/salon/stylist text
  field and a separate location field ("Baku"), both inside one visually
  joined control, with a single filled "Search" button on the right.
- Page title + one-line subcopy ("Verified professionals, real reviews,
  online booking") + a result count ("15 salons").
- **Two-column body**: a scrolling list on the left, a **sticky map on the
  right** that stays in place while the list scrolls. Every list card has a
  numbered badge (1, 2, 3...) and the map has matching numbered pins at each
  salon's real coordinates — the list and the map are the same dataset, two
  views of it, kept in sync by that shared number. This is the single
  biggest structural difference from our directory, which has no map at all.
- **Each list card**: photo carousel (arrows + dot indicents, matches our
  own store-panel carousel already), a heart/favorite icon top-right of the
  photo, name, star rating with a review count in parentheses, a one-line
  description, a location line (district · street address), then up to
  three of its services listed with duration and price (e.g. "Styling ·
  30 min · 20 ₼"), each on its own row with a hairline divider between rows.
  Price is right-aligned, duration is a small clock-icon label.
- Pagination at the bottom (numbered pages), not infinite scroll.
- Footer with a real sitemap (For clients / For salons / Company /
  Language & currency columns) — worth having ourselves eventually, we
  currently have none.

**The filter control** (what the user specifically called "amazing"): it is
**not a popover** — it's a full right-side slide-in drawer/sheet, titled
"Filters" with a close (×), containing:

1. **Service category** — a plain `<select>` ("All services").
2. **District** — a wrapped grid of pill/chip buttons (Yasamal, Nasimi,
   Sabail, Narimanov, Khatai, Nizami, Binagadi, Garadagh, Khazar, Pirallahi,
   Sabunchu, Surakhani, Akhmedli, Badamdar, Seaside Park, Old City), with
   "All districts" as its own chip in the selected/dark state.
3. **Minimum rating** — a short pill row: Any / 3.0+ / 4.0+ / 4.5+ / 5.0.
4. **Availability** — a single chip: "Available today".
5. **Sort** — a plain vertical list, not chips: By relevance (default,
   tinted background to show it's active) / By rating / By number of
   reviews / Price: low to high / Price: high to low.
6. Sticky footer inside the drawer: **Reset** (ghost button) and **Apply**
   (filled, brand color) — filters are staged and only take effect on
   Apply, unlike our current implementation where every click immediately
   resubmits the page.

Notably: **no "closest to me" / geolocation sort exists in their filter**.
Distance is handled entirely by the map (you look at where the pins are),
not as a sort option. Our filter button (`src/components/directory-filters.tsx`,
shipped 2026-08-21) does the opposite — geolocation-based distance sort with
no map. Worth deciding deliberately which model (or both) fits us once this
redesign starts, rather than assuming sira's approach is strictly better.

## 2. Salon / store detail page (`/salon/{slug}`)

- Breadcrumb trail (Home · Beauty salons in Baku · category · district ·
  salon name).
- Title + star rating (with a "See reviews" link) + share icon + favorite
  icon, all top-of-page, no hero banner behind it.
- Photo gallery: one large photo left, a 2×2 grid of smaller photos right,
  with a "See all photos" overlay button on the last tile — richer than our
  current single-row carousel, worth considering for the store detail page
  specifically (directory cards can stay carousel-style, they're small).
- Address line + a small pill: "Check availability on the booking
  calendar".
- Services section: tab-style category chips (All / Hair / Hammam / etc.)
  above a filterable services list, with a running count ("6 services ·
  from 20 ₼").
- A **sticky right-rail summary card** ("Choose services" — pick one or
  several, see the total and free time slots), which is effectively the
  start of the booking flow anchored beside the content instead of being a
  separate step. Our booking flow is a separate full-page step after
  picking a service; this pattern is worth studying once the booking UI is
  in scope, not just the directory.

## 3. Register / login (`/en/register`)

- **Split screen** on desktop: left half is a full-bleed gradient panel
  (their brand terracotta-to-burnt-orange), with the wordmark + a small
  circular logo mark top-left, and a headline + one-line subcopy anchored
  bottom-left ("Beauty in one tap" / "Thousands of salons in Baku are ready
  to welcome you. Book online anytime."). Right half is a plain white
  panel with the form.
- Form: "Create account" title + subcopy, then labeled fields (First name /
  Last name side by side, Email, Phone with a fixed "+994" prefix, Password
  with a show/hide eye toggle, Confirm password), **every input has a
  leading icon** (person / mail / phone / lock) inside the field, not just a
  bare box.
- Consent line inline above the submit button ("By clicking 'Sign up', you
  agree to the terms of use and the privacy policy," both real links).
- Primary CTA is full-width, filled, brand gradient, with a trailing arrow
  icon ("Sign up →").
- "Already have an account? Log in" directly under the button.
- A secondary **"Continue with Google"** button below that, plain white with
  the Google logo, separated by whitespace rather than a divider line.
- **Mobile** collapses to a single column: the gradient panel disappears
  entirely, replaced by the circular logo mark centered above the wordmark
  at the top, then the same form stacked full-width. Also worth noting:
  mobile carries a **persistent bottom tab bar** (Home / Search / Bookings /
  Favorites / Profile) site-wide, which is a fundamentally different
  navigation model from ours (we have none — everything is top-header-only).
  This is directly relevant to the already-open "mobile-friendliness audit"
  roadmap item.

Our current `/login` is OTP-only (phone or email code, no password), which
is a deliberate and reasonable product difference, not a gap — don't copy
password fields wholesale. What's worth adapting regardless: the icon-in-
input treatment, the split-screen brand panel with a real one-line value
prop instead of a bare card on a plain background, and the mobile fallback
of a centered circular logo mark.

## 4. Cross-cutting patterns worth adopting

- **Chip/pill groups** instead of native `<select>` dropdowns for anything
  with a small fixed set of mutually-exclusive-or-multi options (district,
  rating, availability). More scannable and touch-friendly than a dropdown,
  and it's what actually made their filter feel "amazing" rather than being
  a novel mechanism — it's a well-executed familiar one.
- **Deferred-apply filtering** (Reset/Apply footer) instead of
  submit-on-every-click. Fewer full-page reloads when someone is trying
  several combinations.
- **Map + numbered-pin list sync** for "where is this" instead of (or
  alongside) a distance sort.
- **Icon-prefixed form fields** across every text input, not just password.
- A real one-line value-proposition headline on auth screens instead of a
  bare card — currently our `/login` and `/onboarding` pages have no such
  copy at all, just a title.

## 5. Logo asset

**Status: done 2026-08-21.** `/home/wali/Downloads/schedule-logo.png` — a woven-knot square mark (interlocking
rounded-square strands with a center dot) in a warm bronze/gold tone on a
flat ivory-ish canvas, close to but not pixel-identical to our actual
`--background` token. It should **not** be dropped in as-is: the canvas
edge would show as a faint mismatched square against the page background.
Before using it anywhere in the header/nav (matching sira's small circular
mark next to their wordmark) it needs either:

- a tight crop to the mark's bounding box with the background made
  transparent, then rendered inside a circular frame (matches sira's
  treatment exactly, and matches our own "avatar fallback circles stay
  fully round" shape rule from `DESIGN.md`), or
- the flat canvas background swapped to exactly `--background` /
  `--card` so it sits flush with the page with no visible edge.

Went with the transparent-background treatment for in-page use (background
removed via a color-distance alpha ramp, cropped tight to the mark's
bounding box, saved as `public/logo-mark.png`, wired into `SiteHeader` and
the `/login` wordmark) since it preserves the artwork without clipping any
of the interlocking loops. For the favicon specifically (`src/app/icon.png`)
the mark is instead composited onto a filled ivory circle, matching sira's
circular chip treatment — a browser tab benefits from a filled shape that a
transparent PNG can't guarantee against dark browser chrome. The stale
default Next.js `public/favicon.ico` was removed.

## Resolved

1. ~~Map on the directory page~~ — built: full sira-style split list+map,
   plus our own geolocation distance sort kept alongside it (both, not
   either/or — sira has no distance sort at all, ours had no map; combining
   them was strictly additive).
2. ~~Deferred-apply vs. instant-submit filter~~ — **decided: kept
   instant-submit.** Not revisited unless asked again.
3. ~~Mobile bottom tab bar~~ — built, consumer-facing routes only.
4. ~~Store detail page gallery~~ — built: large+2×2 grid at `sm+`, carousel
   stays on mobile.

5. ~~How much of this applies to admin/staff dashboards~~ (sira's site has
   no public dashboard to benchmark against, so this was always original
   design work, not adaptation) — **resolved 2026-08-21: don't force it.**
   The consumer-side patterns (bottom tab bar, split-screen brand panel,
   sticky rail) don't map cleanly onto an owner/staff workflow, so none of
   them were pushed. Two small, real inconsistencies were fixed instead
   (display font on the dashboard store name, icon-prefixed staff-invite
   inputs) — see the status note at the top. Future admin/staff visual
   work should be judged on its own merits, not against this brief.
