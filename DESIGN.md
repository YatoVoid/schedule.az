---
name: Schedule.az
description: Booking directory for Baku service businesses, styled as "City in Bloom"
colors:
  background: "oklch(0.966 0.011 78)"
  foreground: "oklch(0.3 0.035 162)"
  card: "oklch(0.99 0.006 85)"
  primary: "oklch(0.46 0.075 162)"
  primary-foreground: "oklch(0.985 0.008 85)"
  muted-foreground: "oklch(0.52 0.02 160)"
  border: "oklch(0.885 0.016 80)"
  sage: "oklch(0.915 0.032 138)"
  sage-soft: "oklch(0.952 0.016 130)"
  sage-line: "oklch(0.82 0.05 140)"
  coral: "oklch(0.64 0.13 35)"
  blossom: "oklch(0.78 0.085 10)"
  blossom-ink: "oklch(0.68 0.12 8)"
  guard-forest: "oklch(0.46 0.075 162)"
  guard-coral: "oklch(0.6 0.15 30)"
  guard-slate: "oklch(0.42 0.07 265)"
  guard-ochre: "oklch(0.66 0.12 80)"
  guard-rose: "oklch(0.6 0.12 5)"
typography:
  display:
    fontFamily: "Instrument Serif, serif"
    use: "hero and section headlines, italic second line, big stat numbers"
  body:
    fontFamily: "DM Sans, Golos Text (Cyrillic fallback), system-ui"
  data:
    fontFamily: "DM Mono, monospace"
    use: "eyebrow labels, prices, durations, dates, measured numbers"
rounded:
  base: "0.625rem"
  surface: "calc(0.625rem * 1.3)"
  panel: "calc(0.625rem * 1.6)"
---

# Design System: Schedule.az

## Overview

**"City in Bloom."** Replaced "The Carpet Register" on 2026-10-19, from the designer's Figma export (14 screens). Warm ivory ground, forest green as the only action color, sage for grouped panels, coral and blossom pink as accents.

## Color

- `primary` (forest green): buttons, active nav underline, links, store names in the directory.
- `sage` panels (`panel-sage` utility) group related cards: the owner "This month" block, the profile tab, add-service and add-staff forms.
- `coral`: eyebrows on the directory, star ratings, the unseen-booking dot, pending status.
- `blossom`: the owner band on the directory, the highlighted first stat on the owner overview, and the submit button inside sage add-forms (`variant="blossom"`).
- `guard-1..5`: category color for map pins and category chips only, hashed from the free-text category (`src/lib/category-color.ts`).

## Typography

- Instrument Serif for display moments. A headline is two lines: the first upright, the second italic in coral, green or blossom ink.
- DM Sans for everything else, including page titles like "Good to see you," and store names (`font-heading`, medium, tight tracking). Golos Text loads only for Cyrillic glyphs, since DM Sans has none.
- DM Mono for the `eyebrow` utility (small caps, wide tracking) and for data.

## Surfaces

- `surface` utility: white card, hairline border, soft two-layer shadow. Used for list rows, stat tiles, and the `Card` primitive.
- `panel-sage` utility: sage background, `sage-line` border, larger radius. Holds cards, never sits inside one.
- Status pills (`src/components/status-pill.tsx`): pending is coral on a coral tint, confirmed is green on sage, completed is solid green.

## Layout

- Sticky `SiteHeader` on every page except login: logo, centered section links, "Your businesses" pill switcher, account link, log out. Dashboards pass their own section links, which scroll as a second row on phones.
- Dashboards add `StudioIntro` under the header: "Business studio" eyebrow, back link, store logo and name.
- Consumer pages keep the mobile bottom tab bar; dashboards and onboarding do not.

## Assets

- `public/hero-baku.jpg`: photo by Zulfugar Karimov, https://unsplash.com/photos/WpBhCLZn6zY, Unsplash License (free for commercial use, no attribution required). Cropped to 5:4 and recompressed. The photo in the original Figma file was watermarked "@lyokin.photos" and was not used.

## Rules carried over

- No claim on a page that isn't true today. The Figma copy about exhibitions, open-air tables and "spring day passes" was rewritten to describe booking. The mockup's notification toggles and Language/Region/Currency rows were left out because nothing backs them yet.
- No fake stats or social proof.
- Stay inside the palette family. New accents are shades of the existing colors, never a new hue. No pure black or slate backgrounds, no neon glows.
- No gradient text, hype badges, floating dashboard mockups, decorative glassmorphism, animated gradient borders or background grid patterns.
- No generic feature grids. If a section would still work with another product's name swapped in, rewrite it for this one.
- Plain is fine when plain is honest. Remove anything whose only job is to look premium.
- Before shipping a page: only palette colors, every claim true today, nothing that could be pasted onto another product.
