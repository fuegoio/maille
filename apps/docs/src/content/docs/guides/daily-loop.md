---
title: The daily loop
description: Reconcile, categorize, review — the primary workflow, and where each step lives in the UI.
---

Maille is built around a short, repeatable session: **reconcile, categorize, review**. The UI (apps/ui-react) is organized around exactly that loop, with status as the primary signal — every list surface shows `scheduled / incomplete / completed` and reconciled state the same way.

## The loop

```
record movements (CLI) → reconcile → categorize → review
```

### 1. Reconcile

The **To reconciliate** view is the entry point of a session: it lists activities whose movements are not yet reconciled — activities that touch a movements-tracked account but whose transactions don't match their linked bank lines.

For each, either:

- **Link the movement yourself**: allocate the movement's amount across one or more activities until it is fully allocated (see [movements](/concepts/movements/)). The moment the sums match, the movement turns `completed` and the activity turns `completed`.
- **Let the assistant do it**: the per-movement [AI reconciliation workflow](/guides/ai-reconciliation/) links or creates activities under the same exact-allocation rules, asks you a question when the evidence is ambiguous, and gives up rather than guessing.

Both paths end in the same state: movement reconciled, activity completed — because the state is computed, never asserted.

### 2. Categorize

Set `category` and `subcategory` (and a `project` where relevant) on the activities. Categories are plain labels; they never affect the money or the derived types. The AI workflows use your categories as a signal when creating activities, so a consistent taxonomy pays off.

### 3. Review

The **months** view groups your activities by month — the reviewing surface where the month's revenue, expenses, and balances are checked before you close it. Activity filters support the full review vocabulary: date windows (`before` / `after` with relative values like "1 month ago"), amount operators (`equal`, `greater or equal`, ...), name/description text operators, type, category, and source/destination account.

## Where things live

| Route                          | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| `/activities/to-reconciliate`  | Activities whose movements are not reconciled          |
| `/activities`                  | All activities, with filters, search, and export       |
| `/movements`                   | Bank movements and their reconciliation state          |
| `/months/<month>`              | Month review                                           |
| `/funds`, `/funds/untracked`   | Fund balances, positions, and the Untracked complement |
| `/accounts`, `/counterparties` | Accounts, counterparties (and their assets)            |
| `/categories`, `/projects`     | Taxonomy and projects                                  |

## Why the loop is fast

- Status is computed, so there is no "mark as done" step — matching the sums **is** the step.
- Every entity carries an append-only history, so undoing a mis-categorization is an edit, not a mystery.
- The UI is keyboard-first where practical, and interaction is optimistic — the daily loop is designed for one-gesture actions, one entity at a time.

Related guides: [recording bank movements](/guides/bank-sync/) (step 0 of the loop) and [AI reconciliation workflows](/guides/ai-reconciliation/).
