# AA-Design Design System

**AA-Design** is a residential architectural design company serving southwest Ontario, producing design drawings from initial concept through to building-permit-ready sets. This is a brand-guidelines-only design system: no codebase, Figma file, or existing product screens were provided — only a logo (`uploads/AD-Logo.png`) and a written brief covering fonts and colors. Everything here (components, UI kit, foundations) was authored from that brief, not recreated from an existing product.

**Sources provided:** `uploads/AD-Logo.png` (logo mark). No Figma link, GitHub repo, or codebase was attached.

## Index

- `styles.css` — root stylesheet, imports everything in `tokens/`
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`
- `assets/logo/` — primary circular badge (paper / sand / charcoal discs), transparent-disc knockout marks (charcoal / paper / brass), and a wordmark lockup with the thin/thick line motif
- `components/core/` — Button, IconButton, Card, Badge
- `components/forms/` — Input, Select, Checkbox, Radio
- `components/navigation/` — Tabs
- `components/feedback/` — Tooltip, Dialog, Toast
- `ui_kits/marketing-site/` — 4-screen click-through recreation of a typical AA-Design marketing site
- `guidelines/` — foundation specimen cards (colors, type, spacing, brand)
- `SKILL.md` — portable skill file for use in Claude Code

## Components

Core: **Button**, **IconButton**, **Card**, **Badge**
Forms: **Input**, **Select**, **Checkbox**, **Radio**
Navigation: **Tabs**
Feedback: **Tooltip**, **Dialog**, **Toast**

### Intentional additions
No source defined a component inventory, so this is the standard set sized to the brief: enough to build a marketing site and a lead-capture flow (the company's obvious near-term need) without inventing enterprise-scale primitives (no data tables, complex nav, avatars) the brand has no use for yet.

## Content Fundamentals

- **Voice:** warm, plain-spoken, and expert — a firm explaining a technical process (design → permit → build) to homeowners, not to other architects. Short declarative sentences. No jargon without a plain-English gloss ("permit-ready drawing set", not "CDs").
- **Person:** speaks as "we"; addresses the reader as "you" — direct and personal, never third-person ("clients").
- **Casing:** sentence case for headings and body copy; UI labels (buttons, badges, nav) are set in small caps via letter-spacing, not literal ALL CAPS in copy.
- **Emoji:** never used — the brand is precise and drafting-adjacent, not casual.
- **Numbers:** concrete and specific where used ("14 weeks", "2,400 sq ft") rather than vague superlatives ("fast", "spacious") — specificity is the credibility signal for a technical service.
- **Example lines:** "From concept to permit, we handle the drawings." / "A 2,400 sq ft custom home in Elmvale, ON — permit-ready in 14 weeks." / "We'll follow up within one business day."

## Visual Foundations

- **Color:** two-color brand (charcoal `#1E1E1E` + brass `#A9825A`) plus warm neutrals (sand `#D8CFC0`, paper `#FAFAF8`). Charcoal is the dominant ink/surface color for dark sections and text; brass is a precise, sparing accent — one rule, one underline, one icon at a time. Never use brass as a large fill; it reads as gold/decorative at scale. Backgrounds are flat paper or charcoal — no gradients.
- **Type:** Fraunces (serif, display/headings only) carries all the brand personality — used big, at moderate weight (500–600), often with tight/negative letter-spacing. Public Sans (body/UI) stays quiet: regular weight, generous line-height (1.5–1.65), plain sentence case. Never set Public Sans in a heading role or Fraunces in a paragraph role.
- **Spacing:** loose, architectural whitespace — an 8px-rooted scale (see `tokens/spacing.css`) with generous section padding (48–144px) reflecting drafting-sheet margins, not a dense app UI.
- **Backgrounds:** flat charcoal or paper fields; no photographic textures, no illustration, no patterns. Photography (when supplied) should be warm, natural daylight, uncropped horizontal exteriors/interiors — never staged studio white.
- **Animation:** minimal — short (120–200ms), standard-eased fades and color transitions only (see `--duration-*` / `--ease-standard`). No bounce, no springy overshoot; the brand is precise, not playful.
- **Hover/press states:** color shift only (charcoal↔brass, opacity on ghost text) — no scale/shrink transforms. Buttons underline-accent brightens on hover; press states use a slightly darker fill.
- **Borders:** hairline (1–1.5px) charcoal borders are the default UI border. The signature device is a **thick line parallel to a thin line** (see `guidelines/brand-line-motif.html`) — a nod to architectural line-weight conventions (bold outline vs. fine detail line). Used as button underlines, card top/bottom rules, and in the wordmark lockup; never as a generic "colored left border" card decoration.
- **Corners:** sharp-leaning — 2–4px radius on cards/buttons/inputs, pill only for badges. Nothing rounds like a consumer app.
- **Shadows:** soft and shallow (`--shadow-card`), reserved for cards sitting on paper backgrounds; charcoal sections use borders/rules instead of shadows for separation.
- **Transparency/blur:** used only for modal scrims (`Dialog`), never decoratively.
- **Imagery color vibe:** warm, natural light, minimal grain — consistent with a residential/homeowner-facing brand (not cool/clinical, not heavily filtered).

## Iconography

No icon set, icon font, or SVG sprite was supplied with the brief. Components (`IconButton`, `Tooltip` demo) accept icons as props/children rather than shipping their own icon set — pass in Unicode glyphs (as used sparingly in the demo cards, e.g. ✕) for placeholder purposes only. **For production use, substitute a CDN icon set with a similar geometric, single-weight stroke style** — [Lucide](https://lucide.dev) (clean geometric line icons) is the closest free match to the brand's precise, drafting-line aesthetic. This substitution is flagged here rather than assumed; no icons were drawn or generated for this system. Emoji are never used as icons per the content guidelines above.

## Caveats & asks

- **No product source was attached** — no Figma file, GitHub repo, or existing site. Every component and the UI kit were authored fresh from the color/font brief, not recreated from anything existing. If Albanezi Design already has a website or brand deck, attach it and this system should be rebuilt against it.
- **Fonts load via Google Fonts CDN** (`tokens/fonts.css` `@import`s the Fraunces + Public Sans stylesheet) rather than self-hosted `.woff2` binaries — this works identically for consumers but isn't offline-safe. If self-hosted fonts matter, provide the `.woff2` files (or ask to have them fetched) and this will be swapped to local `@font-face`.
- **The logo** is the supplied circular badge (A-frame house, flanking pines, winding river). Variants were produced by recoloring the supplied artwork into brand tones — the A-frame reads charcoal, the pines and river read brass, on a paper / sand / charcoal disc. The mark's geometry was not redrawn or altered. The source JPEG is preserved at `assets/logo/logo-source.jpg`; **if you have vector (SVG/AI/EPS) artwork, send it** — the recolored PNGs are raster and will soften at large display sizes.
- **The "thin line parallel to a very thick line" request** lives on as a **line-weight motif** in the UI (button underlines, card rules, the wordmark lockup — see `guidelines/brand-line-motif.html`), not inside the badge itself.
- Ask: react to the color usage, the line-weight motif, and the UI kit screens — I can iterate on layout, add more component states, or build a second UI kit (e.g. a client portal) if useful.
