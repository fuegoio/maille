# Product

## Register

product

## Platform

web

## Users

Developers who self-host Maille and manage their own finances with it. They run their own instance against their own Postgres database, sync bank movements from their own machine, and spend short daily or weekly sessions reconciling, categorizing, and reviewing their money. They are technically fluent, comfortable with dense interfaces and keyboard input, and they chose this tool because they want a correct model rather than a simplified one.

## Product Purpose

Maille is a personal finance tool for developers built on a strict double-entry ledger: every activity is backed by transactions between accounts, movement reconciliation is explicit, sharing/liability is computed rather than eyeballed, and money can be labeled by purpose (funds) independently of where it lives (accounts). Success looks like a user who trusts every number on screen because they know the model underneath never approximates: the balance, the fund allocation, the shared liability, and the reconciled status all derive from the same ledger, and the UI exposes that structure instead of hiding it behind summaries.

## Positioning

A precise, double-entry personal ledger — zero approximation, every euro fully accounted for.

## Brand Personality

**Precise instrument.** The interface reads like a well-made measuring tool: dense where density aids scanning, quiet where decoration would only add noise, monospaced numbers where numerals must align. Voice is direct and technical without being terse — labels name things exactly ("movement reconciled", "fund allocation"), never with marketing gloss. The emotional goal is trust and control: after a session, the user should feel their numbers are exactly right.

## Anti-references

- Generic SaaS admin templates: identical card grids, KPI tiles, hero metrics with gradient accents, dashboard chrome for its own sake.
- Consumer fintech cuteness as a secondary guardrail: pastel gradients, rounded blobs, illustrated mascots, celebratory confetti on financial events.

## Design Principles

1. **Show the model.** The double-entry structure — activities, transactions, movements, accounts, funds — is Maille's value. Surfaces should expose ledger structure (which accounts, which fund, reconciled or not), not collapse everything into one summary number.
2. **Numbers are the interface.** Alignment, monospaced tabular figures, and units are load-bearing. A misaligned amount column is a bug, not a style choice.
3. **Precision earns trust; clutter erodes it.** Prefer quiet, instrument-like density over decoration. Every accent, animation, and border must carry information; if it doesn't, remove it.
4. **State should be legible at a glance.** Scheduled / incomplete / completed, reconciled / unreconciled, over-allocated / under-allocated — status is a first-class visual dimension with consistent, restrained treatment.
5. **Fast for the daily loop.** The reconcile-categorize-review cycle is the primary workflow; interactions in it should be one gesture (keyboard where practical) and optimistic.

## Accessibility & Inclusion

WCAG 2.1 AA contrast across light and dark themes, including placeholder text and muted foregrounds. Reduced motion respected: every animation needs a `prefers-reduced-motion: reduce` alternative. Keyboard-first where practical for the daily loop (tables, dialogs, command palette).
