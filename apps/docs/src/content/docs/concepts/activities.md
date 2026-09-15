---
title: Activities
description: The user-facing events of the ledger, with derived types, per-type amounts, and the scheduled / incomplete / completed status.
---

An activity is what you actually did: "October salary", "Rent — October", "Supermarket run". It is the unit you name, categorize, and review; everything numeric underneath is [transactions](/concepts/transactions/) between [accounts](/concepts/accounts/).

## Fields

```ts
type BaseActivity = {
  id: string;
  name: string;
  description: string | null;
  date: Date;
  category: string | null; // ActivityCategory id
  subcategory: string | null; // ActivitySubCategory id
  project: string | null; // Project id
  transactions: Transaction[];
  movements: ActivityMovement[]; // links to bank movements (with amounts)
};
```

Everything else on an activity is **computed**, not stored:

```ts
type Activity = BaseActivity & {
  types: ActivityType[]; // derived from the accounts involved
  amounts: ActivityAmounts; // per-type sums of the transaction legs
  amount: number; // total = sum of per-type amounts
  sharing: ActivitySharing[]; // computed liability per user
  status: ActivityStatus; // scheduled | incomplete | completed
  history: SerializedHistoryEntry[]; // append-only change timeline
};
```

## Derived types

`ActivityType` is `expense`, `revenue`, `investment`, or `neutral`. The activity's `types` array is derived from its transactions' accounts:

- A transaction leg touching an `expense` account adds `expense`; a `revenue` account adds `revenue`; an `investment_account` adds `investment`.
- If a transaction has **no typed account on either side** — or the activity has no transactions at all — the activity gets `neutral`.
- An activity can carry several types at once (its transactions touch several kinds of accounts).

You never set the type. Model the money correctly in transactions, and the type follows.

## Per-type amounts

`amounts` is a record of sums per type: `{ expense, revenue, investment, neutral }`. The rules, exactly as the ledger computes them:

| Transaction leg                 | Effect                 |
| ------------------------------- | ---------------------- |
| into an expense account         | `expense += amount`    |
| out of an expense account       | `expense -= amount`    |
| out of a revenue account        | `revenue += amount`    |
| into a revenue account          | `revenue -= amount`    |
| into an investment account      | `investment += amount` |
| out of an investment account    | `investment -= amount` |
| no typed account on either side | `neutral += amount`    |

`amount` (the activity's headline number) is the sum of the four per-type values — used for sorting and comparisons. The per-type sums are rounded to two decimals at computation time.

### Example

"Rent — October" pays 950.00 from Checking to a `Rent` expense account through the counterparty "Landlord":

| Transaction | From                      | To               | Amount   |
| ----------- | ------------------------- | ---------------- | -------- |
| t2          | Checking (`bank_account`) | Rent (`expense`) | `950.00` |

- `types` is `["expense"]` (checking is untyped, rent is an expense account).
- `amounts.expense` is `+950.00` (money flowing into the expense account).
- `amount` is `950.00`.
- Net across accounts: Checking `-950.00`, Rent `+950.00` — sums to zero.

An activity like "Supermarket run" split as one card payment of 60.00 from Checking to Groceries has `amounts.expense = 60.00`. If instead 54.00 went to Groceries and 6.00 to a Household expense account through two transactions, both legs count into `expense`, `amounts.expense` is still `60.00`, and the per-account nets (Checking `-60.00`, Groceries `+54.00`, Household `+6.00`) still sum to zero.

## Status

`ActivityStatus` has three values:

| Status       | When                                                         |
| ------------ | ------------------------------------------------------------ |
| `scheduled`  | The activity's date is in the future                         |
| `incomplete` | Past-dated, but its movements are not reconciled (see below) |
| `completed`  | Past-dated and movements reconciled                          |

"Reconciled" means: for every account with `movements: true` that the activity's transactions touch, the activity's transaction net on that account equals the total of its linked movement amounts on that account (details in [movements](/concepts/movements/)). An activity whose transactions touch a movements-tracked account but that has no linked movement is `incomplete` — its status tells you your ledger and your bank disagree somewhere.

## Categories, subcategories, projects

- `ActivityCategory` and `ActivitySubCategory` are plain labels (`{ id, name, emoji }`); a subcategory belongs to a category.
- `Project` groups activities over time (`{ id, name, emoji, startDate, endDate }`, status `scheduled | in progress | completed`).

Categories and projects are orthogonal to the money — the activity's types and amounts never depend on them.

## History

Every activity carries an append-only history (`SerializedHistoryEntry[]`) rendered as a timeline on the activity page: create, update, link, unlink, updateLink, addTransaction, updateTransaction, removeTransaction. The same applies to movements. Editing an activity never erases what was there before.
