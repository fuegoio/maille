---
title: Movements
description: Bank lines and their explicit reconciliation to activities — how "movement reconciled" and "activity completed" are computed.
---

A movement is a line from your bank: a real-world event on one account, with a name, a date, and a signed amount. Maille does not fetch statements from your bank automatically — you record movements from your own machine (see [recording bank movements](/guides/bank-sync/)), so the movement list is exactly what you chose to track.

## Fields

```ts
type Movement = {
  id: string;
  date: Date;
  amount: number; // signed: negative for money leaving the account
  account: string; // the movements-tracked account it happened on
  name: string; // raw bank label ("CB SUPERMARKET")
  activities: MovementActivity[]; // links to activities, with amounts
  status: MovementStatus; // incomplete | completed
  history: SerializedHistoryEntry[];
};
```

The link objects are the reconciliation records:

```ts
type MovementActivity = {
  id: string;
  activity: string; // activity id
  amount: number; // how much of the movement belongs to this activity
};
```

## Status

`MovementStatus` is `incomplete` or `completed`. A movement is **completed** when its links fully allocate it: the sum of link amounts equals the movement amount, within a rounding tolerance of `0.001`. Link amounts carry the movement's sign — a `-60.00` card payment is allocated with links like `-54.00` and `-6.00`.

## Reconciliation

Reconciliation is computed per activity, per movements-tracked account. For each account with `movements: true`:

1. Sum the activity's transactions on that account (outgoing negative, incoming positive) — the **transaction total**.
2. Sum the amounts of the activity's linked movements that live on that account — the **movement total**.
3. The account is reconciled when the two totals are equal (rounded to two decimals) **and** there is at least one linked movement.

The activity is `completed` only when every movements-tracked account it touches is reconciled. There is no "mark as reconciled" button to fight with — fix the money, and the state follows.

### Worked example: a split payment

The supermarket card payment, recorded as a movement of `-60.00` on Checking, actually covers two purposes. You link it to two activities:

| Activity           | Link amount  |
| ------------------ | ------------ |
| Groceries          | `-54.00`     |
| Household supplies | `-6.00`      |
| **Sum**            | **`-60.00`** |

Groceries has one transaction, Checking → Groceries for `54.00`; Household supplies has Checking → Household for `6.00`. Per-account reconciliation for Groceries on Checking:

|                                    | Amount   |
| ---------------------------------- | -------- |
| Transaction total (Checking)       | `-54.00` |
| Movement total (links on Checking) | `-54.00` |

Totals match with at least one movement → the account is reconciled; same for Household supplies (`-6.00` both sides). The movement is **completed** (`-54.00 + -6.00 = -60.00`), and both activities are **completed** as well.

If you had linked only `-54.00` and left `-6.00` unallocated: the movement stays `incomplete` (`-6.00` remaining), Household supplies has a transaction total of `-6.00` on Checking but a movement total of `0` → not reconciled → the activity is `incomplete`. Both surfaces disagree with the bank by the same 6.00, and both say so.

## Movements without activities

Movements do not require activities to exist — they are ledger objects of their own, listed and editable independently (name, date, amount, account). The `movements list --unreconciled` CLI flag filters to the ones whose status is `incomplete`, which is exactly your to-do list after a bank sync.

## AI assistance

Each movement can carry at most one reconciliation **workflow** (see [AI reconciliation workflows](/guides/ai-reconciliation/)) — an assistant that links the movement to activities or creates new ones for you, under the same exact-allocation rules.
