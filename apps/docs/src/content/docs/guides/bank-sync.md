---
title: Recording bank movements
description: Record bank lines from your own machine with the CLI, optionally with AI extraction from pasted statements.
---

Maille does not connect to your bank. Movements are recorded **from your machine**, with the `maille` CLI, so your bank credentials never touch the Maille server. This page is the "step 0" of the [daily loop](/guides/daily-loop/).

## Record movements with the CLI

After [connecting the CLI](/getting-started/connect-the-cli/), create movements for the lines you see in your bank's app or export:

```bash
maille movements create \
  --name "CB SUPERMARKET 12/09" \
  --amount -60.00 \
  --account <account-id> \
  --date 2026-09-12
```

- `--amount` is signed: negative for money leaving the account, positive for income.
- `--account` is the movements-tracked account id — get them with `maille accounts list`.
- `--date` defaults to today; use the bank's own date for backfilling.

Other movement commands:

```bash
maille movements list --unreconciled   # your reconciliation to-do list
maille movements update <id> --name "..." --amount -60.00
maille movements delete <id>
maille movements link <id> --activity <activity-id> --amount -60.00
```

`movements link` is the CLI path to reconciliation: it creates the movement-activity link with an amount, and the movement becomes `completed` once the link amounts sum to the movement amount. Split payments are just multiple links.

## Bulk extraction from a pasted statement

For longer backfills, the API exposes an extraction mutation that parses pasted text — a bank statement, an email, an HTML page — into a structured movement list **without writing any state**:

```graphql
mutation {
  extractMovements(text: "...") {
    movements {
      name
      date
      amount
    }
    dropped
  }
}
```

The extractor (from `@maille/workflows`) returns every movement line it can read confidently — raw label, `yyyy-MM-dd` date, signed amount — and reports `dropped` for lines it could not parse rather than inventing values. Totals and balances in the pasted document are ignored. You review the result, then record the movements as above. The same assistant powers the AI workflow system; see [AI reconciliation workflows](/guides/ai-reconciliation/) for its configuration.

## Then reconcile

Recording a movement only adds a bank line. The movement shows up in the UI with status `incomplete` until it is fully allocated to activities — continue with [the daily loop](/guides/daily-loop/).
