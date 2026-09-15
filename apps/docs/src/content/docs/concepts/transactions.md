---
title: Transactions
description: The atomic ledger entries — an amount from one account to another, with optional counterparties and fund moves.
---

A transaction is the atom of the ledger: one amount, one source account, one destination account. Activities are made of them; balances and [fund positions](/concepts/funds/) are replayed from them.

## Fields

```ts
type Transaction = {
  id: string;
  amount: number;
  fromAccount: string;
  fromCounterparty?: string | null;
  fromAsset?: string | null;
  toAccount: string;
  toCounterparty?: string | null;
  toAsset?: string | null;
  fundMoves?: FundMove[];
};
```

- `amount` is the quantity moved, always positive. The direction is carried by the from/to pair, not by a sign.
- Each side can carry a counterparty (e.g. "Landlord" on the destination side of a rent payment) or an asset, refining **where inside the account** the money sits.
- `fundMoves` re-label the moved money across [funds](/concepts/funds/). They ride on the transaction, so fund state is replayed from ledger state — there is no separate "fund ledger".

## Rules

- A transaction always names exactly two accounts. The zero-sum invariant is structural: for any set of transactions, the sum of per-account net changes is zero.
- [Activity types and amounts](/concepts/activities/) are derived from the accounts a transaction touches. Expense accounts, revenue accounts, and investment accounts are the only "typed" ones.
- Adding or editing transactions on a reconciled activity is expected to change its [status](/concepts/movements/#reconciliation) back to `incomplete` until the movement links match again — the status is computed, so it can't be lied to.

## Worked example: an activity with two transactions

"Moving cash out" — you withdraw 100.00 from Checking to Cash, then lose 20.00 of it (a household expense paid in cash):

| Transaction | From                      | To                    | Amount   |
| ----------- | ------------------------- | --------------------- | -------- |
| t1          | Checking (`bank_account`) | Cash (`cash`)         | `100.00` |
| t2          | Cash (`cash`)             | Household (`expense`) | `20.00`  |

Net per account:

| Account   | Net change |
| --------- | ---------- |
| Checking  | `-100.00`  |
| Cash      | `+80.00`   |
| Household | `+20.00`   |
| **Sum**   | **`0.00`** |

The activity's derived `types` is `["expense"]` (t2 touches an expense account; t1 is a neutral internal transfer), `amounts` is `{ expense: 20.00, revenue: 0, investment: 0, neutral: 100.00 }`, and `amount` is `120.00` — the sum of the per-type amounts. Note that `amount` is a sorting/comparison number, not the activity's "effect on your balance"; the per-account nets above are that effect.

## Fund moves on transactions

A transaction's `fundMoves` say how the money it moves crosses fund boundaries. For the salary transaction (2,800.00 Revenue → Checking), earmarking 300.00 for the "Japan trip" fund looks like:

```json
{
  "id": "fm1",
  "fromFund": null,
  "toFund": "fund-japan-trip",
  "amount": 300.0,
  "date": "2026-10-01",
  "note": null,
  "transaction": "t1"
}
```

`fromFund: null` means the money entered from outside the fund system (Untracked); `toFund: null` means it left it — for example an expense consuming the fund. See [funds](/concepts/funds/) for the balance computation.

## CLI and API

Transactions are managed per activity: `maille transactions add <activity-id> --amount 20 --from-account ... --to-account ...`, and the GraphQL mutations `addTransaction`, `updateTransaction`, `deleteTransaction` (all scoped by `activityId`). See the [CLI reference](/reference/cli/).
