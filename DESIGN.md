---
name: Schedule.az
description: Booking directory for Baku service businesses, styled as a woven carpet register
colors:
  primary: "oklch(0.47 0.16 27)"
  primary-foreground: "oklch(0.98 0.012 75)"
  background: "oklch(0.965 0.012 75)"
  foreground: "oklch(0.22 0.014 55)"
  card: "oklch(0.99 0.007 75)"
  secondary: "oklch(0.93 0.014 70)"
  secondary-foreground: "oklch(0.3 0.02 60)"
  muted: "oklch(0.93 0.012 70)"
  muted-foreground: "oklch(0.48 0.02 60)"
  accent: "oklch(0.88 0.05 75)"
  accent-foreground: "oklch(0.32 0.07 50)"
  destructive: "oklch(0.5 0.18 25)"
  border: "oklch(0.84 0.018 65)"
  guard-madder: "oklch(0.47 0.16 27)"
  guard-indigo: "oklch(0.38 0.08 265)"
  guard-saffron: "oklch(0.62 0.13 80)"
  guard-bottle-green: "oklch(0.45 0.09 150)"
  guard-plum: "oklch(0.42 0.1 330)"
typography:
  display:
    fontFamily: "Unbounded, ui-sans-serif, system-ui"
    fontWeight: 500
    letterSpacing: "normal"
  body:
    fontFamily: "Golos Text, ui-sans-serif, system-ui"
    fontWeight: 400
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
rounded:
  sm: "3px"
  md: "4.5px"
  lg: "6px"
  xl: "7.8px"
components:
  store-panel:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
  store-panel-category-chip:
    backgroundColor: "color-mix(in oklch, guard-color 16%, {colors.card})"
    textColor: "guard-color"
    rounded: "{rounded.sm}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
---

# Design System: Schedule.az

## Overview

**Creative North Star: "The Carpet Register"**

The directory is a woven register, not a card grid. Every business occupies one panel framed by a hairline guard-band in a category color, rotated from Azerbaijani carpet dye traditions (madder red, indigo, saffron, bottle green, plum), the way a woven field is divided into medallions by its guard-bands rather than by drop shadows. This is a deliberate refusal of the Yelp/Google-Maps/booking-SaaS default: white cards, one blue accent, star ratings, product photography standardized down to a thumbnail. Nothing here is decorative "ethnic" skin over a generic grid — the guard-band is structural (it's the only depth cue; there are no card shadows anywhere), and it is functional wayfinding (category = color, consistently, everywhere the directory renders).

Ground is warm ivory wool (`oklch(0.965 0.012 75)`), not paper-white and not the stock shadcn near-white. Corners stay tight (6px base radius) — the weave is square, not soft. Madder red is the single brand accent reserved for booking actions and primary links; indigo, saffron, bottle green, and plum exist only as category-coding guard-bands, never as decoration layered on top of an otherwise-generic surface.

This system replaced a first-pass, undirected AI-generated shadcn default (green primary, gray neutrals, Geist Sans, `rounded-xl` shadowed cards) that had no deliberate visual decisions behind it and did not reflect this product's Baku market. `CLAUDE.md`'s prior mention of a warm amber/terracotta palette was never implemented anywhere in code and has been superseded by this system; update or remove that note when next touching `CLAUDE.md`.

**Key Characteristics:**
- Hairline guard-bands replace shadows as the only depth/framing device.
- Category color is functional wayfinding, applied consistently, not decorative.
- Ivory wool ground, madder-red single brand accent, tight square corners.
- Unbounded display type only at high-signal moments (page title, store name, category chip); Golos Text carries all body/UI copy, chosen specifically for clean Azerbaijani-Latin and Cyrillic rendering since real store content is often in either script.

## Colors

Full-palette strategy: a restrained neutral ground and chrome (ivory wool, charcoal text, one madder-red brand accent) carries the UI, while a fixed five-color guard-band rotation (madder, indigo, saffron, bottle green, plum) is reserved entirely for category wayfinding on directory panels. The two systems never mix: guard colors never appear on buttons or system chrome, and the brand accent never appears as a category color.

### Primary
- **Madder Red** (`oklch(0.47 0.16 27)`): Booking CTAs, primary links, focus ring, active states. Used sparingly outside the guard-band rotation — it is the one color that always means "act here."

### Full palette — category guard-bands
- **Madder Red** (`oklch(0.47 0.16 27)`) / **Indigo** (`oklch(0.38 0.08 265)`) / **Saffron** (`oklch(0.62 0.13 80)`) / **Bottle Green** (`oklch(0.45 0.09 150)`) / **Plum** (`oklch(0.42 0.1 330)`): Assigned per store by a stable hash of its category string (`src/lib/category-color.ts`), so a given category always draws the same guard-band across the whole directory without needing a maintained category enum. Renders as the panel's 2px border, its category-chip text/background tint, and its carousel dot indicator.

### Neutral
- **Ivory Wool** (`oklch(0.965 0.012 75)`, background): Page ground. Warm, not paper-white.
- **Bone Card** (`oklch(0.99 0.007 75)`, card): Panel and surface fill, barely lighter than ground — separation comes from the guard-band border, not elevation.
- **Charcoal Wool** (`oklch(0.22 0.014 55)`, foreground): Body text.
- **Muted** (`oklch(0.93 0.012 70)` / `oklch(0.48 0.02 60)` fg): Secondary text, placeholders, empty states.
- **Border** (`oklch(0.84 0.018 65)`): Hairline dividers (header rule, input borders) outside the guard-band system.

### Named Rules
**The Guard-Band Rule.** A panel's only depth cue is its 2px guard-band border in its category color. No `box-shadow` on any directory or dashboard card; if something needs to visually separate from the ground, it gets a hairline border, never a shadow.

**The One Voice Rule.** Madder red is the sole brand accent. It never doubles as a category color and a category guard-band never substitutes for a primary action's color.

## Typography

**Display Font:** Unbounded (weights 500/700), with system-ui fallback
**Body Font:** Golos Text, with system-ui fallback
**Label/Mono Font:** Geist Mono, for time, price, and duration data only

**Character:** Unbounded's geometric, faceted, squared terminals echo the weave's grid logic without imitating a carpet pattern literally. Golos Text is a plain, confident grotesk chosen specifically because it covers Azerbaijani Latin Extended (ə, ğ, ı, ö, ş, ü, ç) and Cyrillic in one family — real store names and descriptions arrive in either script.

### Hierarchy
- **Display** (Unbounded 500, `text-2xl`): Page-level titles ("Find a business to book").
- **Title** (Unbounded 500, `text-sm`–`text-lg`): Store names on panels and detail pages, category chip labels.
- **Body** (Golos Text 400, `text-sm`): All UI copy, descriptions, form labels.
- **Label** (Golos Text 400/500, `text-xs`–`text-[10px]`, uppercase, tracked): Category chips, muted metadata (address, timestamps).
- **Data** (Geist Mono, `text-sm`): Booking times, prices, durations — anywhere a number is measured rather than described.

### Named Rules
**The Display-Is-Rare Rule.** Unbounded appears only at page titles, store names, and category labels. Every paragraph, button, input, and form label stays in Golos Text. A page where Unbounded carries body copy has lost the hierarchy.

## Layout

Homepage directory renders as a responsive grid of store panels (2 columns on mobile, 3 on tablet, 4 on desktop, `gap-3`), inside a `max-w-5xl` container — wide enough for the woven-field grid to read as a field, not a single-file list. Search and category filter sit above the grid as one row on desktop, stacked on mobile. Inner pages (store detail, admin, account) keep their existing single-column `max-w-2xl` layouts; the token repaint (color, radius, type) applies there, but the panel/guard-band grid system is specific to the directory surface.

## Elevation & Depth

Flat by design — no box-shadows anywhere in the directory or dashboard. Depth and separation are carried entirely by the guard-band border (a 2px hairline in category color) and by the small tonal step between `--background` and `--card`. This is a deliberate departure from the prior shadcn default's `ring-1 ring-foreground/10` soft-shadow cards.

### Named Rules
**The Flat-By-Default Rule.** No panel, card, or dropdown gets a `box-shadow` at rest. Popovers and dialogs (native overlay elements) are the one exception, where a shadow signals "this floats above the page," not "this is a card."

## Shapes

Corners are tight and square-leaning: base radius 6px (`--radius: 0.375rem`), scaled down from the prior 12px default. Store panels, buttons, and inputs use this restrained radius; only true pill elements (avatar fallback circles) stay fully round. The guard-band border is always 2px solid, never a gradient or dashed line — it reads as a woven edge, not a UI accent.

## Components

### Store Panel (signature component)
- **Shape:** `rounded-md` (6px), 2px solid guard-band border in the store's category color, `overflow-hidden`.
- **Photo carousel:** When a store has 2+ uploaded photos, they auto-cycle every 3.2s with a 700ms opacity crossfade; small dot indicators in the guard color mark position. Below 2 photos, falls back to the store's logo or initials avatar on a muted ground — never a stock photo or generic illustration standing in for a real business.
- **Body:** Store name in Unbounded, category chip below it (tinted background at 16% of the guard color, text in the full guard color), address in muted text.
- **Hover:** Panel lifts 2px (`-translate-y-0.5`); no shadow gained, the guard-band stays the only frame.

### Buttons
- **Shape:** `rounded-lg` (unchanged component structure from the inherited shadcn/base-ui primitives; radius scale now resolves smaller globally).
- **Primary:** Madder red background, ivory-wool foreground text.
- **Hover/Focus:** Existing opacity/ring behavior inherited from the component library, now keyed to the new token values.

### Cards / Containers (dashboard, forms)
- **Corner Style:** `rounded-xl` per the existing card component, now resolving to the tightened radius scale.
- **Background:** `--card` (bone).
- **Shadow Strategy:** None; existing `ring-1 ring-foreground/10` hairline retained from the inherited component.
- **Border:** Hairline `--border`.

### Inputs / Fields
- **Style:** Hairline border, `--input` token, unchanged component structure, repainted to the new palette.

### Navigation
- **Site header:** Wordmark in Unbounded, `.az` in madder red; hairline bottom border; no shadow, no blur-heavy glass treatment beyond the existing `backdrop-blur` on scroll.

## Do's and Don'ts

### Do:
- **Do** assign category color through `categoryGuardVar()` (hash-based) rather than a maintained per-category color map — categories are free text from real store owners, not a fixed enum.
- **Do** keep the guard-band as the only depth cue on directory and dashboard panels; reach for a hairline border, not a shadow.
- **Do** fall back to logo/initials, never a stock photo or illustration, when a store has fewer than 2 uploaded gallery photos.
- **Do** keep Unbounded scoped to titles, names, and category labels only.

### Don't:
- **Don't** add `box-shadow` to any panel or card at rest; that reintroduces the prior generic-SaaS depth system this direction replaced.
- **Don't** use madder red as a category guard-band color, or a guard color as a primary action color — the two palettes stay separate.
- **Don't** invent stock photography, testimonials, or usage stats anywhere on the directory; every business shown must be a real store record, every photo a real upload.
