---
title: The double-entry ledger
description: The model under Maille — activities, transactions, movements, accounts, and funds, and the invariants that hold across them.
---

Maille is a strict double-entry ledger. Nothing is a summary that can drift: every number you see is computed from the same structure, on demand. The structure has five objects:

| Object                                     | What it is                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [**Account**](/concepts/accounts/)         | A bucket of money: a bank account, cash, or a flow account like an expense or revenue account |
| [**Transaction**](/concepts/transactions/) | One movement of an amount from one account to another                                         |
| [**Activity**](/concepts/activities/)      | The user-facing event (a purchase, a salary) — backed by one or more transactions             |
| [**Movement**](/concepts/movements/)       | A line from your bank, which you explicitly reconcile to activities                           |
| [**Fund**](/concepts/funds/)               | A purpose label for money, tracked independently of which account it lives in                 |

The invariants that make the ledger correct:

- **Zero-sum**: every transaction moves an amount between exactly two accounts, so for any set of transactions, the net change summed over all accounts is zero.
- **No inferred amounts**: an activity's type (expense, revenue, investment, neutral) and its per-type amounts are derived from the accounts its transactions touch — never set by hand.
- **Explicit reconciliation**: bank movements become "reconciled" only when the sum of activity links equals the movement amount, and an activity is "completed" only when, per movements-tracked account, its transactions match its linked movements.
- **Computed sharing**: liability between users is computed from transactions through counterparties — never a manual split number.
- **Replayed funds**: a fund's balance is never stored; it is replayed from opening allocations and fund moves, so it stays consistent with the ledger by construction.

## A worked month

Throughout the concepts pages we use the same small example. A user starts with **Checking** (a `bank_account`, movements tracked) at a starting balance of `1,000.00`, plus the default flow accounts **Revenue** and **Expense**, and named expense accounts **Rent** and **Groceries**.

Three activities make up the month:

**1. "October salary"** — a revenue activity:

| Transaction | From    | To       | Amount     |
| ----------- | ------- | -------- | ---------- |
| t1          | Revenue | Checking | `2,800.00` |

**2. "Rent — October"** — an expense activity, paid to a counterparty:

| Transaction | From     | To   | Amount   |
| ----------- | -------- | ---- | -------- |
| t2          | Checking | Rent | `950.00` |

**3. "Supermarket run"** — an expense activity:

| Transaction | From     | To        | Amount  |
| ----------- | -------- | --------- | ------- |
| t3          | Checking | Groceries | `60.00` |

Net effect on accounts:

| Account   | Net change  |
| --------- | ----------- |
| Revenue   | `-2,800.00` |
| Checking  | `+1,790.00` |
| Rent      | `+950.00`   |
| Groceries | `+60.00`    |
| **Sum**   | **`0.00`**  |

The sum is exactly zero — that is the double-entry invariant. Checking's balance is now `1,000.00 + 1,790.00 = 2,790.00`, and it equals starting balance plus the net of all transactions touching Checking.

Each of these activities is also reconciled against [movements](/concepts/movements/) — real bank lines (`+2,800.00` payroll, `-950.00` rent transfer, `-60.00` card payment) linked to the activities with matching amounts. Reconciliation is what turns `incomplete` into `completed`.

## Where to read next

Each concept gets its own page with the real field names and rules from the codebase:

- [Accounts](/concepts/accounts/) — account types, starting balances, counterparties, assets
- [Activities](/concepts/activities/) — derived types, per-type amounts, status
- [Transactions](/concepts/transactions/) — legs, counterparties, fund moves
- [Movements](/concepts/movements/) — bank lines, links, reconciliation
- [Funds](/concepts/funds/) — allocations, moves, balances, positions
- [Sharing and liability](/concepts/sharing/) — shared accounts and computed liability
