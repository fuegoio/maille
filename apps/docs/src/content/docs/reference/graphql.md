---
title: GraphQL API
description: The self-hosted GraphQL API — endpoint, authentication, queries, mutations, and subscriptions.
---

The API (`apps/api`) is a GraphQL server built with GraphQL Yoga and Pothos on Postgres (Drizzle). The complete, canonical schema lives in `apps/api/schema.graphql` — the server regenerates that file from code on every boot, so it is always the source of truth for your version.

## Endpoint and transport

- The API listens on port 3000 and serves under the `/api` prefix: **`POST /api/graphql`** for queries and mutations.
- **Subscriptions** use GraphQL over SSE (`@graphql-yoga/plugin-graphql-sse`); the server advertises the `x-graphql-event-stream-token` header for the event stream.
- A single subscription exists: `events` — one `Event` per change (`createActivity`, `updateMovement`, ...), which is how every client (UI, CLI, other instances) stays in sync. `Query.events(lastSync: Float!)` replays events since a timestamp.
- The `Date` scalar is used for all dates.

## Authentication

Requests carry a better-auth **bearer token**:

```bash
curl -s https://your-instance.example.com/api/graphql \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ movements { id name status } }"}'
```

Tokens come from the device-authorization login (the [CLI flow](/getting-started/connect-the-cli/)) or the web UI's session. All queries and mutations are scoped to the authenticated user.

## Queries

```graphql
accounts            activities          activityCategories
activitySubcategories  assets          contacts
counterparties      events(lastSync: Float!)  fundAllocations
funds               movements           projects
workflows(statuses: [String!])
```

## Mutations

Full signatures are in `schema.graphql`. Grouped by entity:

- **Ledger**: `createActivity`, `updateActivity`, `deleteActivity`, `addTransaction`, `updateTransaction`, `deleteTransaction`
- **Movements**: `createMovement`, `updateMovement`, `deleteMovement`, `createMovementActivity`, `updateMovementActivity`, `deleteMovementActivity` (movement links are the reconciliation records)
- **Accounts**: `createAccount`, `updateAccount`, `deleteAccount`, `shareAccount`
- **Funds**: `createFund`, `updateFund`, `deleteFund`, `setFundAllocations` (replaces a fund's opening allocations wholesale)
- **Sharing**: `shareActivity` (returns the computed `[ActivitySharing!]`)
- **Taxonomy**: `createActivityCategory`, `updateActivityCategory`, `deleteActivityCategory`, `createActivitySubCategory`, `updateActivitySubCategory`, `deleteActivitySubCategory`, `createProject`, `updateProject`, `deleteProject`
- **Other entities**: `createAsset`, `updateAsset`, `deleteAsset`, `createCounterparty`, `updateCounterparty`, `deleteCounterparty`, `createContact`, `deleteContact`
- **AI**: `extractMovements(text: String!)` — parse pasted text into movements, no state written; `triggerWorkflow(movementId, message)`, `answerWorkflow(id, content, optionId)` — see [AI reconciliation workflows](/guides/ai-reconciliation/)

All mutations take client-generated `id` arguments (uuid strings) — ids are yours to assign, which is what keeps offline-first clients and sync replay deterministic.

## Key types

The types map one-to-one onto the [core model](/concepts/double-entry-ledger/):

```graphql
type Activity {
  amount: Float! # computed total
  amounts: ActivityAmounts! # { expense, investment, neutral, revenue }
  types: [String!]! # derived from accounts
  status: String! # scheduled | incomplete | completed
  transactions: [Transaction!]!
  movements: [ActivityMovement!]! # links (with amounts)
  sharing: [ActivitySharing!]! # computed liability per user
  history: [HistoryEntry!]!
  # ...
}

type Movement {
  status: String! # incomplete | completed
  activities: [MovementActivity!]!
  workflow: MovementWorkflow # the movement's unique workflow, if any
  # ...
}
```

Computed fields — `Activity.amounts`, `Activity.sharing`, `Movement.status`, activity `types` — are derived on read, never stored, which is the API-level guarantee that they cannot drift from the ledger.

## Example: a full reconciliation by API

```graphql
# 1. Record the bank line
mutation {
  createMovement(
    id: "0b1bd5f8-ef3e-48f6-9c2e-7c1d2f3a4b5c"
    name: "CB SUPERMARKET 12/09"
    date: "2026-09-12"
    amount: -60.00
    account: "<checking-account-id>"
  ) {
    id
    status
  }
}

# 2. Link it to an existing activity for 54.00
mutation {
  createMovementActivity(
    id: "6b2de9a1-3c4f-4a55-9b1e-1a2b3c4d5e6f"
    movementId: "0b1bd5f8-ef3e-48f6-9c2e-7c1d2f3a4b5c"
    activityId: "<groceries-activity-id>"
    amount: -54.00
  ) {
    id
  }
}

# 3. ...and for the remaining 6.00 to a second activity
mutation {
  createMovementActivity(
    id: "9c3ef0b2-4d50-4b66-8c2f-2b3c4d5e6f70"
    movementId: "0b1bd5f8-ef3e-48f6-9c2e-7c1d2f3a4b5c"
    activityId: "<household-activity-id>"
    amount: -6.00
  ) {
    id
  }
}

# The movement is now fully allocated (-54.00 + -6.00 = -60.00)
query {
  movements {
    id
    name
    status
  }
}
```

The last query returns the supermarket movement with `status: "completed"` — no mutation was needed to close it.
