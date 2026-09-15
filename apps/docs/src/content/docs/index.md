---
title: Introduction
description: Maille is a personal finance tool for developers built on a strict double-entry ledger — every euro fully accounted for.
---

Maille is a personal finance tool for developers built on a strict double-entry ledger. Every activity is backed by transactions between accounts, movement reconciliation is explicit, sharing and liability are computed rather than eyeballed, and money can be labeled by purpose (funds) independently of where it lives (accounts).

The promise is zero approximation: the balance, the fund allocation, the shared liability, and the reconciled status all derive from the same ledger. Nothing on screen is a separate, drifting copy.

## How Maille is organized

Maille is a monorepo of a few pieces. The docs follow the same shape.

```bash
maille/
├── packages/core        # Ledger model: types, derived computations, filters
├── packages/workflows  # AI workflows: movement extraction, reconcile-movement
├── apps/api            # GraphQL API + auth, self-hosted against your Postgres
├── apps/cli            # `maille` CLI — runs on your machine, records movements
└── apps/ui-react       # Web UI for the reconcile → categorize → review loop
```

- **`@maille/core`** defines the model — activities, transactions, movements, accounts, funds, sharing — and every rule computed on top of it (activity types and amounts, movement and account reconciliation, fund balances and positions). The UI and the API never re-implement these rules; they read from them.
- **`@maille/api`** is a GraphQL server (GraphQL Yoga, Pothos) backed by Postgres (Drizzle), with authentication through better-auth (email/password, Google, bearer tokens, and device authorization for the CLI).
- **`maille`** (the CLI) authenticates against your instance from your own machine and records bank movements for you.
- **`apps/ui-react`** is the web interface for the daily loop: reconcile movements, categorize activities, review months.

## Reading path

1. **Get started** — [self-host the API](/getting-started/self-hosting/), then [connect the CLI](/getting-started/connect-the-cli/).
2. **Concepts** — the [double-entry ledger](/concepts/double-entry-ledger/) and its five objects: [accounts](/concepts/accounts/), [activities](/concepts/activities/), [transactions](/concepts/transactions/), [movements](/concepts/movements/), and [funds](/concepts/funds/), plus [sharing and liability](/concepts/sharing/).
3. **Guides** — [the daily loop](/guides/daily-loop/), [recording bank movements](/guides/bank-sync/), and [AI reconciliation workflows](/guides/ai-reconciliation/).
4. **Reference** — [CLI commands](/reference/cli/), the [GraphQL API](/reference/graphql/), and [configuration](/reference/configuration/).

## Conventions in these docs

Amounts are plain numbers in the ledger's currency (Maille does not model multi-currency; your user has a single `currency`). Expense amounts are **negative** when they come from a bank movement, and ledger examples always sum to zero across accounts — that is the double-entry invariant, and every worked example here respects it.
