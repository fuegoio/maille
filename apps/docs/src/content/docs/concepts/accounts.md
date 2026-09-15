---
title: Accounts
description: Account types, starting balances, counterparties, and assets — the buckets money moves between.
---

Accounts are the buckets of the ledger. Every [transaction](/concepts/transactions/) moves an amount from one account to another, and account types drive how [activity types](/concepts/activities/) are derived.

## Account types

`AccountType` has seven values, in two families:

| Type                 | Family  | Meaning                                                           |
| -------------------- | ------- | ----------------------------------------------------------------- |
| `bank_account`       | balance | A real bank account; movements can be tracked on it               |
| `investment_account` | balance | A brokerage account; drives the `investment` activity type        |
| `cash`               | balance | Physical cash                                                     |
| `assets`             | balance | Non-liquid assets (see [assets](#assets) below)                   |
| `liabilities`        | balance | Money owed                                                        |
| `expense`            | flow    | Where spent money goes; drives the `expense` activity type        |
| `revenue`            | flow    | Where earned money comes from; drives the `revenue` activity type |

Balance accounts hold money across time; expense and revenue accounts are flows — the ledger treats everything except `expense` and `revenue` as a balance account when computing fund positions.

## Fields

```ts
type Account = {
  id: string;
  name: string;
  type: AccountType;
  default: boolean; // default account of its type
  startingBalance: number | null; // balance at your starting date
  startingCashBalance: number | null; // cash part of the starting balance
  movements: boolean; // bank movements are tracked on this account
  sharing: AccountSharing[]; // see "Sharing and liability"
};
```

- `startingBalance` seeds the account at your user's `startingDate`. Transactions before that date are ignored by the fund-position replay; the balance you see is `startingBalance` plus the net of transactions on the account.
- `movements: true` marks accounts that appear on your bank statements — reconciliation is computed **per movements-tracked account** (see [movements](/concepts/movements/)). Your instance's default **Bank account** and **Investment account** are created with `movements: true`; flow accounts are not.
- `sharing` lists the users an account is shared with, as `{ role: "primary" | "secondary", sharedWith: string, proportion: number }`.

When you sign up, Maille bootstraps a default account set for you: Revenue, Expense, Cash, Assets, Liabilities (all `default: true`, `movements: false`) plus Bank account and Investment account (`movements: true`). Rename them and add your own accounts freely; nothing depends on the names — **the account type is what matters**.

## Counterparties

A counterparty is an entity outside your own accounts: a landlord, a merchant, a friend. Counterparties belong to an account and can be attached to either leg of a transaction (`fromCounterparty` / `toCounterparty`):

```ts
type Counterparty = {
  id: string;
  account: string; // the account it lives on
  name: string;
  description: string | null;
  contact: string | null; // a contact user id — drives shared liability
  initialBalance: number | null;
};
```

The `contact` field is what links a counterparty to another Maille user — when a transaction runs through such a counterparty, that user's [liability](/concepts/sharing/) is computed from it.

## Assets

Assets are records held inside `assets`-type accounts:

```ts
type Asset = {
  id: string;
  account: string;
  name: string;
  description: string | null;
  location: string | null;
};
```

Use them to track individual things (a car, a flat) without splitting the account's balance.

## CLI and API

Accounts are fully manageable from the CLI (`maille accounts create --name "Checking" --type bank_account --movements`) and the GraphQL API (`createAccount`, `updateAccount`, `deleteAccount`, `shareAccount`). See the [CLI reference](/reference/cli/) and [GraphQL reference](/reference/graphql/).
