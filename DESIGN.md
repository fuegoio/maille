---
name: Maille
description: A precise, double-entry personal ledger — developer-grade bookkeeping with zero approximation.
colors:
  # Light theme (canonical tokens live in apps/ui-react/src/index.css as OKLCH)
  background: "#f8fbf8"
  foreground: "#0e130e"
  card: "#fdfefd"
  primary: "#226837" # Ledger Green, light theme
  primary-foreground: "#f8fbf8"
  secondary: "#ebf0eb"
  muted: "#ebf0eb"
  muted-foreground: "#535e53"
  accent: "#e1ebe1"
  destructive: "#c92324"
  border: "#ccd3cc"
  chart-1: "#93c69d"
  chart-2: "#5a9e6a"
  chart-3: "#226837"
  chart-4: "#154f27"
  chart-5: "#11371b"
  sidebar: "#f1f5f1"
  # Dark theme
  background-dark: "#0e130e"
  foreground-dark: "#eff3ef"
  card-dark: "#131813"
  primary-dark: "#63b376" # Ledger Green, dark theme
  secondary-dark: "#202620"
  muted-dark: "#202620"
  muted-foreground-dark: "#9ea89e"
  destructive-dark: "#f3625d"
  border-dark: "#eff3ef24"
  sidebar-dark: "#090e09"
typography:
  display:
    fontFamily: "Source Serif 4 Variable, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: "Source Serif 4 Variable, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1
  section:
    fontFamily: "Source Serif 4 Variable, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.01em"
  numeric:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
rounded:
  sm: "0px"
  md: "2px"
  lg: "4px"
  xl: "8px"
  2xl: "12px"
  full: "9999px"
spacing:
  xs: "1px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  popover:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "8px"
  sidebar:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.foreground}"
---

# Design System: Maille

## 1. Overview

**Creative North Star: "The Modern Ledger"**

Maille is a double-entry personal ledger for developers, and the interface commits to the accountant's discipline updated for a screen: ruled hairlines instead of printed grid paper, tabular numerals aligned in columns, status carried by quiet marks rather than loud badges. Every surface should feel like a page in a well-kept ledger — orderly, dense where density aids scanning, and completely trustworthy.

The system is deliberately quiet. Ledger Green appears only where the user acts (primary buttons, active nav, focus) or where the interface must assert state; everything else is a near-monochrome, green-tinted neutral. Source Serif 4 gives brand and authentication moments an archival ledger voice, while Geist remains the workhorse for product UI. Amounts are always monospaced and right-aligned — alignment is correctness made visible, and in a bookkeeping tool a misaligned number column is a defect. Density is tuned to the compact type scale (base 0.9375rem), which fits the instrument register: more rows visible, less scrolling, more context per screen.

This system explicitly rejects generic SaaS-admin chrome — identical KPI card grids, hero metrics with gradient accents, dashboard decoration for its own sake — and consumer-fintech cuteness (pastel gradients, mascots, confetti on financial events). Maille surfaces ledger structure: which accounts, which fund, reconciled or not.

**Key Characteristics:**

- Hairline borders (`--border`, 1px) structure the page; ambient shadow depth is reserved for floating layers (dropdowns, popovers, dialogs) alongside a `ring-1 ring-foreground/10` hairline.
- Monospaced tabular figures for every amount; right-aligned, never wrapped.
- Compact type scale (base 0.9375rem / 15px), line-height 1 for UI text, generous 1.5 for prose.
- Light and dark themes are both first-class, tokenized in OKLCH.
- Motion is measured in milliseconds (100–150ms), ease-out, and respects `prefers-reduced-motion`.

## 2. Colors

The palette is a near-monochrome, green-tinted neutral ramp with one saturated voice: Ledger Green, the color of an archival account book.

### Primary

- **Ledger Green** (light `oklch(0.46 0.105 150)` / `#226837`; dark `oklch(0.7 0.12 150)` / `#63b376`): the single action color. Primary buttons, active navigation, focus rings, selection, and balance charts. Used on well under 10% of any screen — its rarity is what makes it legible.
- **Ledger Green Foreground** (light `oklch(0.985 0.004 145)` / `#f8fbf8`; dark `oklch(0.18 0.012 145)` / `#0e130e`): text on Ledger Green fills.

### Neutral

- **Background** (light `oklch(0.985 0.004 145)`; dark `oklch(0.18 0.012 145)`): subtly green-tinted app canvas.
- **Card / Popover** (light `oklch(0.995 0.002 145)`; dark `oklch(0.2 0.012 145)`, popover slightly lifted): raised surfaces.
- **Foreground** (light `oklch(0.18 0.012 145)`; dark `oklch(0.96 0.006 145)`): warm-black body text.
- **Muted** (light `oklch(0.95 0.008 145)`; dark `oklch(0.26 0.014 145)`) with **Muted Foreground** (light `oklch(0.47 0.022 145)`; dark `oklch(0.72 0.018 145)`): secondary text, table headers, metadata. Both combinations exceed WCAG AA.
- **Border** (light `oklch(0.86 0.012 145)`; dark `oklch(0.96 0.006 145 / 14%)`): the 1px ruled line — the most important mark in the system.

### Semantic

- **Destructive** (light `oklch(0.577 0.245 27.3)`; dark `oklch(0.704 0.191 22.2)`): delete, over-drawn funds, negative remaining balances. Negative amounts also use it in tables.
- **Chart ramp** (chart-1 through chart-5): green monochrome ramp from `oklch(0.78 0.08 150)` to `oklch(0.3 0.065 150)`, for data visualization only.
- **Activity type colors** (used sparingly in charts and marks): semantic `activity-revenue`, `activity-expense`, `activity-investment`, and `activity-neutral` tokens adapt to both themes. Reconciliation warnings use the separate `warning` token.

### Named Rules

**The One Voice Rule.** Ledger Green is the only saturated brand voice on a screen. If a design needs a second saturated color, it is a status (destructive, activity-type) — never a decoration.

**The Ruled-Line Rule.** Structure comes from 1px `--border` hairlines, not background fills or shadows. When in doubt, add a hairline, not a tint.

## 3. Typography

**Brand Display Font:** Source Serif 4 Variable (fallback: Georgia, serif)
**Body / Product Font:** Geist Variable (fallback: sans-serif)

Source Serif 4 is the editorial voice inside the product: use it for static headings that orient the user, never for editable names, buttons, labels, table rows, or numeric data.
**Numeric Font:** system monospace (`ui-monospace, SFMono-Regular, Menlo, monospace`) — via Tailwind `font-mono`

**Character:** Source Serif 4 is competent, archival, and restrained; it appears in brand moments, authentication headings, the wordmark, and selected static section or analytical titles. Geist remains geometric, technical, and slightly engineered across product UI. The monospace counterpart for numerals makes alignment the visible expression of the "zero approximation" claim.

### Hierarchy

- **Brand Display** (400, 2.25rem–4.5rem, lh 0.95–1, Source Serif 4): authentication and brand statements only.
- **Headline** (400, 1.5rem, lh 1, Source Serif 4): authentication, summary-panel titles, static detail-section titles, and major analytical headings. Dialog headers and editable entity names remain Geist.
- **Title** (600, 1.25rem, lh 1): task-oriented section headers and page subtitles (e.g. "New fund").
- **Body** (400, 0.9375rem, lh 1.5): primary reading size. Longest prose stays within 65–75ch.
- **Label / table text** (400–500, 0.8125rem–0.875rem, lh 1): table rows, form labels, metadata — the workhorse register of the app. Table headers use `text-xs font-medium text-muted-foreground`.
- **Amount** (500, 0.875rem, lh 1, monospace): every money figure, right-aligned, `whitespace-nowrap`.

### Named Rules

**The Tabular Figure Rule.** Money is always `font-mono`, right-aligned, `whitespace-nowrap`, and never wrapped or truncated mid-amount. Sums and totals use the same treatment at `text-sm` with heavier weight (500/600).

**The Quiet Header Rule.** Section headers inside tables are lowercase-ish muted labels at `text-xs font-medium`, not bold display text. The data is the hero, not the chrome.

## 4. Elevation

Ambient depth: floating layers cast soft shadows (`shadow-md` for popovers and dropdowns, `shadow-lg`/`shadow-xl` for dialogs and command palettes) combined with a `ring-1 ring-foreground/10` hairline so edges stay crisp on both themes. In-page surfaces (table rows, cards in content flow) stay flat with hairline borders; hover states tint the background (`hover:bg-muted/50`) rather than lifting. Dialogs get `backdrop-blur`-free dimmed scrim; keep it that way — blur glass is an anti-reference.

### Shadow Vocabulary

- **Popover / dropdown** (`shadow-md` + `ring-1 ring-foreground/10`): transient menus, selects.
- **Dialog / command palette** (`shadow-lg`–`shadow-xl` + ring): modal surfaces.
- **In-page**: no shadows; `--border` hairlines only.

### Named Rules

**The Floating-Only Rule.** If it doesn't float above the page (menu, dialog, tooltip), it doesn't cast a shadow. Depth signals interaction layer, not hierarchy inside content.

## 5. Components

Components feel confident-soft: crisp hairline structure, compact but roomy padding, 100–150ms ease-out transitions, no bounce.

### Buttons

- **Shape:** rounded `{rounded.md}` (2px), height 36px (`size-sm` 32px, `size-icon-xs` 28px for table row actions).
- **Primary:** Ledger Green fill, high-contrast foreground, `gap-2` icon+label.
- **Hover:** primary darkens slightly (default shadcn `hover:opacity-90` treatment); ghost/outline use `hover:bg-muted/50`.
- **Secondary / Outline:** `border` hairline + transparent bg; **Ghost:** transparent, text-only, used in table rows where hover reveals actions (`opacity-0 group-hover:opacity-100`).
- **Focus:** `ring` at 50% opacity, no custom glow.

### Chips / Badges

- Hairline border, `text-xs`, rounded-full. Used for type marks and metadata, never as decoration. Status marks prefer a small dot or colored square (3px, `rounded-sm`) over filled badges.

### Cards / Containers

- **Corner:** `{rounded.xl}` (8px); dense controls and charts use 0–2px corners.
- **Background:** `card` token; in dense table views, skip the card — the table IS the page, with `border-b` row dividers.
- **Border:** 1px `--border` on tables (`border-b` per row), full borders on isolated cards.
- **Shadow:** none in-page (see Elevation).
- **Padding:** 24px (`p-6`) page sections, 12–16px inside cards, rows `h-12` with `px-6`.

### Inputs / Fields

- **Style:** transparent bg, 1px `--input` hairline, rounded `{rounded.md}`, height 36px.
- **Focus:** `ring` 1px at 2px offset (shadcn default), duration-100.
- **Amount input:** monospace, right-aligned in tables (`mode="cell"`), plain field in dialogs (`mode="field"`), with popover calculator support.
- **Error:** `border-destructive` hairline + `FieldError` text below; no red fills.

### Navigation

- **Sidebar** (`--sidebar` token): app shell with grouped sections (Analysis / Foundations), 36px item rows, `hover:bg-sidebar-accent`, active item `bg-sidebar-accent font-medium`. Triggers collapse on mobile.
- **Header strip:** `h-8 border-b bg-muted/50 text-xs font-medium text-muted-foreground` column header row above tables — the ledger's ruled header.
- **Page header:** `h-12 border-b` with breadcrumb left, actions right (primary action last, Ledger Green).

### Tables (the primary component)

- **Rows:** `h-12 border-b px-6 hover:bg-muted/50 cursor-pointer`, full-row click navigation.
- **Column headers:** the header strip above (The Quiet Header Rule).
- **Numbers:** monospaced, right-aligned, fixed-width columns (`w-32 text-right`).
- **Row actions:** ghost icon buttons revealed on hover, right-aligned.
- **Empty state:** `Empty` component with muted icon, title, one-line description, and one primary CTA.

### Status

- Activity status and reconciliation state render as quiet text or small marks, consistent per state across every surface (scheduled / incomplete / completed). Never invent a new visual per screen.

### Charts

- Treat charts as ruled analytical surfaces: fine gridlines, monospaced labels, square tooltips, and no decorative shadows.
- Cumulative balances use thin step lines because ledger values change at discrete transactions. Daily flows remain narrow bars.
- Chart motion is disabled; interaction feedback comes from the cursor, active point, and metric controls.

### Authentication

- Desktop authentication uses a Ledger Green brand field beside an unboxed form. Mobile collapses to a compact wordmark above the form.
- Source Serif 4 is reserved for the wordmark and authentication statements; form controls remain Geist.

## 6. Do's and Don'ts

**Do:**

- Use Ledger Green only for primary actions, active state, selection, and balance charts.
- Right-align every amount in monospace; align totals under their columns.
- Structure with 1px hairlines; tint on hover (`bg-muted/50`), never fill to group.
- Keep dialogs compact; forms stack vertically with `space-y-4` and 16px gaps.
- Respect `prefers-reduced-motion` — provide crossfades or instant transitions for every animation (`tw-animate-css` defaults cover this).
- Design the empty state for every list (funds, projects, accounts) with one clear CTA.
- Keep both themes passing AA; check muted foreground on tinted backgrounds before shipping.

**Don't:**

- Don't add card grids of KPI tiles, gradient text, or decorative shadows on in-page surfaces.
- Don't use saturated color for anything that isn't an action or a status.
- Don't wrap or truncate money figures; use fewer decimals or a smaller mono size instead.
- Don't use Source Serif 4 in labels, controls, tables, or data; Geist and mono carry the product hierarchy.
- Don't celebrate financial events with confetti, illustrations, or animation flourishes — the ledger marks, it doesn't cheer.
- Don't replace the table with cards for primary data views. Tables are the product.
