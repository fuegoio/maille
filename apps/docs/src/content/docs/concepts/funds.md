---
title: Funds
description: Label money by purpose — fund trees, opening allocations, fund moves, and computed balances and positions.
---

Funds answer "what is this money for?", independently of "where does it live?" (that is [accounts](/concepts/accounts/)). An envelope system on top of the ledger — but with a critical property: **fund state is never stored**. Balances and positions are replayed from opening allocations and the fund moves attached to [transactions](/concepts/transactions/), so they cannot drift from the ledger.

## Fields

```ts
type Fund = {
  id: string;
  name: string;
  color: string; // one of the fund colors, e.g. "#818cf8"
  startDate: Date | null;
  endDate: Date | null;
  parentFund: string | null; // funds form a tree; cycles are invalid
};

type FundAllocation = {
  id: string;
  fund: string;
  account: string;
  amount: number;
};

type FundMove = {
  id: string;
  fromFund: string | null; // null = Untracked (outside the fund system)
  toFund: string | null; // null = money left the fund system
  amount: number;
  date: Date;
  note: string | null;
  transaction: string | null; // the transaction this move rides on
};
```

Funds form a tree through `parentFund` (null is a root). Reparenting a fund under itself or one of its descendants is rejected — the cycle check runs before any reparenting.

## Opening allocations

A fund's `startDate` is when it starts existing. At that date, you declare how much of each account's balance belongs to the fund:

| Account  | Allocated to "Japan trip" |
| -------- | ------------------------- |
| Checking | `1,200.00`                |

The allocation's date is not stored — it is derived from the fund (start date, falling back to your user's `startingDate`, never earlier). Editing the fund's start date re-dates its allocations.

## Balance computation

A fund's balance is computed, never stored:

```
balance = opening allocations + inflows - outflows
```

- `fromFund: null` on a move means the money entered from **Untracked** — the complement of the fund system.
- `toFund: null` means the money left the tracked funds entirely (an expense consuming the fund).

### Worked example

The "Japan trip" fund, opened on October 1:

| Event                                                                   | Effect      | Balance    |
| ----------------------------------------------------------------------- | ----------- | ---------- |
| Opening allocation on Checking                                          | `+1,200.00` | `1,200.00` |
| Salary transaction carries a fund move (Untracked → Japan trip)         | `+300.00`   | `1,500.00` |
| "Flights to Tokyo" expense carries a fund move (Japan trip → Untracked) | `-420.00`   | `1,080.00` |

The fund's balance is `1,080.00`. The total held by all funds counts only moves with a non-null `toFund` as inflows and non-null `fromFund` as outflows, plus all opening allocations: `300.00 - 420.00 + 1,200.00 = 1,080.00` — every euro of fund balance is accounted for by the same moves.

## Positions

The fund-position replay answers "which account's balance does each fund live in?". It replays the ledger (starting balances, opening allocations, transactions, and their fund legs) and produces, for each account, a composition across funds where `null` is Untracked. Two invariants hold at every point of the replay:

- **Per account**: the sum of positions equals the account balance.
- **Per fund**: the sum of positions equals the fund balance.

Because positions are replayed rather than stored, they stay consistent with the ledger by construction — including at any past date (the replay runs up to the end of a given day).

## Subtree balances

A fund tree's balance is computed by boundary logic: a move between two funds inside the subtree cancels out; a move crossing the subtree's boundary counts once on the inside side. Opening allocations of a subtree's funds count as money entering it. This is how the UI can show "Travel" (a parent fund) as the sum of its children without double-counting internal moves.

## CLI and API

Funds are manageable end-to-end: `maille funds create/update/delete`, and `maille funds allocate --from <fundId> --to <fundId> --amount 20 --note "..."` for a standalone fund move — a re-labeling between two funds where no money changes accounts. On the GraphQL side: `createFund`, `updateFund`, `deleteFund`, and `setFundAllocations` (which replaces a fund's opening allocations wholesale). See the [CLI reference](/reference/cli/).
