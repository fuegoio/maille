---
title: Sharing and liability
description: Share accounts and activities with other users, and how each user's liability is computed from the ledger.
---

Maille is single-user at the ledger level but multi-user at the sharing level: you can share accounts and activities with other Maille users (your household, for example), and the ledger computes what each person actually covers — rather than eyeballing splits.

## Contacts

A contact is another Maille user you interact with:

```ts
type Contact = { id: string; contact: ContactUser; createdAt: Date };
type ContactUser = { id: string; name: string; email: string; image: string };
```

Contacts are referenced by [counterparties](/concepts/accounts/#counterparties): a counterparty's `contact` field binds it to a user. That binding is what turns "the landlord" into "my partner".

## Sharing accounts

`shareAccount(id, userId)` shares an account with another user. The account then carries `AccountSharing` entries:

```ts
type AccountSharing = {
  role: "primary" | "secondary";
  sharedWith: string;
  proportion: number;
};
```

## Sharing activities

`shareActivity(id, userId)` shares an activity with another user. The activity's computed `sharing` array then contains one entry per user:

```ts
type ActivitySharing = {
  user: string;
  liability: number;
  accounts: { account: string; amount: number }[];
};
```

## How liability is computed

The liability is derived from the activity's transactions and the counterparties bound to each user's contact:

- A transaction leg leaving a counterparty whose `contact` is that user (`fromCounterparty`) adds `+amount` to their liability.
- A transaction leg arriving at such a counterparty (`toCounterparty`) adds `-amount`.

In words: money the user put in through their counterparty raises what they covered; money paid back out to their counterparty lowers it. The `accounts` part of the sharing entry carries the same computation restricted to accounts shared between the two users — each shared account's net contribution to the activity.

### Worked example

"Rent — October" is 950.00 total. Your partner covered 475.00 by card through their counterparty "Partner's card" (whose `contact` is your partner); the rest left your Checking. Two transactions:

| Transaction | From                                            | To   | Amount   |
| ----------- | ----------------------------------------------- | ---- | -------- |
| t1          | Checking                                        | Rent | `475.00` |
| t2          | Partner's card (counterparty, on the from side) | Rent | `475.00` |

Account nets: Checking `-475.00`, Rent `+950.00`, and the partner's counterparty side stands for `-475.00` outside your accounts — across all accounts the net is still zero. The activity's computed `sharing` for your partner is:

```json
{
  "user": "partner-user-id",
  "liability": 475.0,
  "accounts": []
}
```

If you later pay the partner back 100.00 through a transaction whose `toCounterparty` is "Partner's card", their liability on that activity drops by `100.00` to `375.00`. Nothing is stored as a split — the numbers move because the ledger moved.

## Where sharing shows up

Shared activities appear for both users with the computed `sharing` breakdown; the [movements](/concepts/movements/) each user reconciles stay their own (each user records movements on their own movements-tracked accounts).
