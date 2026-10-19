@AGENTS.md

# Design policy

This project has to stop reading as an AI-generated website. Not "add personality" as an afterthought, these are hard constraints, checked on every new page or component, not just at the end.

## Banned patterns (generic AI/SaaS template tells)

- **Dark-mode neon palette**: no pure black (`#000000`) or slate-gray (`#030712`, `#0b0f19`) backgrounds, no purple/cyan/magenta accent glows (`#8b5cf6`, `#06b6d4`, `#ec4899`). This project's palette is forest green with sage, coral and blossom pink on a warm ivory (see `globals.css`); stay inside that family. If a new page wants an accent color, it's a shade of the existing palette, not a new hue.
- **Gradient text headers**: no `bg-clip-text text-transparent` fading headlines. Set a real color.
- **Hype badges**: no "✨ Introducing v2.0"-style pill above a headline. A status pill is fine only if it states a real, specific fact (e.g. actual onboarding status), never manufactured excitement.
- **Floating dashboard mockup hero**: no angled fake-screenshot-in-a-browser-frame under the hero CTA.
- **4-card bento feature grid**: no generic "icon top-left, 3-word bold title, two lines of filler" feature grid. If listing features, the copy has to be specific to this product, not swappable with any other SaaS.
- **Fake social proof**: no invented stats ("99.9% uptime", "10,000+ bookings", "500% growth") and no "Trusted by" logo walls, ever, but especially not before there are real customers to name. This is a trust issue as much as a design one.
- **Decorative glassmorphism**: no `backdrop-blur` + `border-white/10` panels used where there's no structural reason for translucency.
- **Shimmer/animated-gradient-border buttons**: buttons get hover/active states, not a perpetual animation loop.
- **Cyberpunk grid overlays**: no faint background grid pattern "for texture."

## What to do instead

- Typography, color, and spacing decisions should trace back to this being a **local Baku service-booking product**, not a generic SaaS. When in doubt, ask "would a barbershop owner or their customer find this trustworthy and clear," not "does this look like a funded startup's landing page."
- Reuse the established palette and type scale rather than introducing a new one per page. Consistency across the app reads as intentional; novelty per-screen reads as improvised.
- Prefer real, specific copy over placeholder-shaped copy. If a sentence would still make sense with the product name swapped out, rewrite it.
- Copy follows the global `no-ai-writing` rules already in effect for this whole session (no em dashes, no "not just X, but Y," no marketing adjectives, no exclamation points, no manufactured urgency). The copy is often the bigger tell than the visuals, fix both.
- It's fine, even good, for a component to look plain if plain is honest. A generic-but-clean layout with specific, real copy beats a stylistically loud layout with template-shaped copy.

## Before shipping any new page or component

1. Does it use only colors from the existing palette?
2. Is every claim on the page true right now, not aspirational?
3. Would this exact section (copy and layout) work unchanged on a different product? If yes, make it more specific to this one.
4. Strip any element whose only purpose is to look "premium" rather than to convey real information.

