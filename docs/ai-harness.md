# AI Harness — movement-to-activity assistant

Design for a background assistant ("the harness") that turns bank movements into
ledger activities. Scope of this document: the movement→activity workflow. Bank
feeding via a Chrome MCP with vision is a later phase and only sketched.

## 1. Summary

The harness is a background worker living inside `apps/api`. For each movement,
at most one **workflow** exists. A workflow runs an AI decision loop that either:

- links the movement to an existing activity,
- creates one or more new activities and links the movement to them,
- asks the user a question and pauses (`pending`), resuming when answered,
- or gives up (`failed`).

Everything the harness does goes through the **same mutation layer as the UI**
(same history computation, same sync events, sentinel `clientId: "harness"`), so
every client converges through the existing event stream and the ledger rules
are never bypassed.

## 2. States

```
                     ┌───────────── (answer) ─────────────┐
                     ▼                                    │
queued ──▶ running ──┼──▶ succeeded (created / linked)     │
             │       └──▶ pending ─────────────────────────┘
             └──▶ failed ──▶ (manual retry) ──▶ queued
                    ▲
cancelled (user reconciled the movement by hand, or movement deleted)
```

| State      | Meaning                                              | Who transitions                          |
| ---------- | ---------------------------------------------------- | --------------------------------------- |
| `queued`   | claimed, waiting for the worker                      | auto trigger, manual trigger, retry     |
| `running`  | decision loop in flight                              | worker                                  |
| `pending`  | asked a question, waiting for the user's answer     | worker (`askUser`)                      |
| `succeeded`| terminal: movement fully allocated to activity(ies)  | worker, verified against link amounts  |
| `failed`   | terminal: model has no clue, or infra error          | worker (`giveUp` / error)               |
| `cancelled`| terminal: user reconciled manually or movement gone  | mutation hooks                          |

Two failure kinds are distinguished in `result.error.kind`:

- `model_give_up` — semantic "no clue": shown as failed, retryable manually.
- `provider_error` / `timeout` / `max_steps` — infra: auto-retried up to
  `HARNESS_MAX_ATTEMPTS` with backoff, then shown as failed.

`succeeded` is only reached when the sum of the movement's activity links equals
the movement amount (i.e. the movement is `completed` per the existing rule).
Partial allocation is never `succeeded`: the loop must either finish the
allocation, ask, or give up.

## 3. Data model

One table, one row per movement, conversation embedded as jsonb (house style,
like the history timelines):

```ts
// tables.ts
export const movementWorkflows = pgTable("movement_workflows", {
  id: text("id").primaryKey(),
  user: text("user").notNull().references(() => user.id, { onDelete: "cascade" }),
  movement: text("movement")
    .notNull()
    .references(() => movements.id, { onDelete: "cascade" })
    .unique(),                       // hard guarantee: one workflow per movement
  status: text("status").notNull()
    .$type<"queued" | "running" | "pending" | "succeeded" | "failed" | "cancelled">(),
  trigger: text("trigger").notNull().$type<"auto" | "manual">(),
  attempts: integer("attempts").notNull().default(0),
  messages: jsonb("messages").$type<WorkflowMessage[]>().notNull().default([]),
  result: jsonb("result").$type<WorkflowResult | null>(),
  error: text("error"),
  createdAt: timestamp(...).defaultNow().notNull(),
  updatedAt: timestamp(...).$onUpdate(...).notNull(),
});
```

Types in `packages/core/src/harness/types.ts` (shared with the UI):

```ts
type WorkflowMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  options?: { id: string; label: string }[]; // assistant message with choices
  optionId?: string;                          // user message answering a choice
  createdAt: string;
};

type WorkflowResult = {
  createdActivities: string[];   // activity ids
  linkedActivities: string[];    // activity ids linked without creating
  error?: { kind: "model_give_up" | "provider_error" | "timeout" | "max_steps"; message: string };
};
```

Sync events (added to the `SyncEvent` union, like every other entity):

- `createWorkflow` — `{ id, movement, status, trigger }`
- `updateWorkflow` — `{ id, patch }` where patch carries status / appended
  message / result / error. Upsert-by-message-id on the client so replays are
  idempotent.

The UI gets a small `workflows` store keyed by `movement`, fed by these events —
identical to how movements/activities stores work today.

## 4. Triggering

**Auto (on each new movement).** At the end of the `createMovement` mutation
(non-blocking, same request): if the harness is enabled for the user,
`INSERT INTO movement_workflows ... ON CONFLICT DO NOTHING` with status
`queued` and emit `createWorkflow`. The unique index makes this idempotent —
replayed imports or mutation retries cannot create a second workflow.

**Manual (on demand).** `triggerWorkflow(movementId)` mutation:

| existing workflow | action                                          |
| ----------------- | ----------------------------------------------- |
| none              | create as `queued`, trigger `manual`            |
| `failed`/`cancelled` | reset to `queued` (attempt++, keep transcript)  |
| `pending`         | no-op (the conversation is already open)         |
| `queued`/`running` | no-op                                            |
| `succeeded`      | no-op (re-run only after unlinking, which sets `cancelled`) |

The movement row gets a "Run assistant" ghost action; a bulk variant
(`triggerWorkflows(filter)`) can process a backlog later.

## 5. Execution model

- **Worker**: in-process loop in `apps/api/src/harness/` (Bun). On boot it
  scans for `queued` workflows; at runtime it is notified by the
  `createWorkflow`/`updateWorkflow` inserts. Runs are serialized through a
  **per-user queue with concurrency 1** (see §6 for why).
- **Run** = assemble evidence (§7) → model tool loop → terminal transition.
  Every write goes through the existing resolver logic, refactored minimally so
  it can be called with a synthetic harness context
  (`ctx = { user: owner, session: { id: "harness" } }`). History entries and
  sync events then attribute to the harness client automatically.
- **Timeouts/limits**: per-step and per-run wall-clock timeouts, max tool
  iterations. Infra failures auto-retry with backoff (`attempts`).
- Single API instance is assumed (self-hosted). If multi-instance ever
  matters, wrap each run in `pg_advisory_lock(user)` — the design does not
  depend on it before that.

## 6. Concurrency: no duplicate activities

The core risk: workflow A (movement 1) and workflow B (movement 2) both decide
to *create* "Spotify subscription" when both movements belong to the same
real-world activity. Guarantees, in order of importance:

1. **One workflow per movement** — unique index + `ON CONFLICT DO NOTHING`
   claim. There is no path to a second workflow for the same movement.
2. **Serial per-user execution** — only one decision loop is ever in flight,
   so a run always sees every activity previously created by earlier runs.
   Personal-finance volume does not need parallelism; correctness is worth
   more than latency here. (This single decision removes the create/create
   race entirely.)
3. **Link-first bias** — the loop must `searchActivities` before any create;
   the create tool itself re-queries matches in the same turn and refuses if a
   close match exists (defense in depth).
4. **Resume re-plans** — after the user answers a `pending` workflow, the loop
   re-runs from evidence (with the transcript included) instead of executing
   the pre-question plan. The pending gap is exactly when other workflows
   (serialized after it) or the user may have created the activity it was about
   to create; re-planning makes the stale plan harmless.
5. **User edits are just edits** — the harness writes ordinary activities and
   links via ordinary mutations. Anything the user changes mid-conversation is
   picked up by the re-planned resume; there is no parallel "draft" world.
6. **Manual reconciliation cancels** — the existing `createMovementActivity`
   mutation gains a small hook: if the movement has a workflow in
   `queued|running|pending`, set it to `cancelled` (+ event). The user is
   never fought by the assistant.

## 7. The decision loop

Deterministic evidence pack (cheap DB queries, assembled before the first model
call):

- **Movement + account** (name, amount, date, account name/type).
- **Similar movements**: movements with same/similar name in history, and —
  the strongest signal — *how they were linked*: which activity, category,
  type, and typical amounts. ("Netflix 12.99 → always expense, category
  Subscriptions, linked to activity X".)
- **Candidate activities**: activities within a date window (±7 days default)
  matching by name or counterparty, plus `scheduled` activities whose date is
  near.
- **Vocabulary**: categories, subcategories, projects, funds, counterparties.

Tools exposed to the model (tool-calling loop):

| tool | effect |
| ---- | ------ |
| `findSimilarMovements(name)` | refine the similar-movements evidence |
| `searchActivities(query, dateWindow?)` | candidate activities |
| `linkMovement(activityId, amount)` | existing link mutation |
| `createActivity(draft)` | existing create (supports partial movement link in the same call) |
| `askUser(question, options?)` | append assistant message, status → `pending` |
| `giveUp(reason)` | status → `failed`, error kind `model_give_up` |

Rules enforced in code, not left to the model:

- amount conservation: total linked ≤ movement amount; run ends in
  `succeeded` only if total = movement amount;
- created activities inherit the movement's date and the account's currency
  context; transactions follow the account/counterparty conventions already in
  `createActivity`;
- a model that neither links, creates, asks, nor gives up within `max_steps`
  → `failed` (`max_steps`).

No-LLM fast path (optional, later): if the similar-movements evidence shows a
single, high-consistency historical pattern (same name, same amount bucket,
one activity/category), link directly and skip the model. Cost control; never
bypasses the same mutations.

## 8. API surface

- `Movement.workflow: MovementWorkflow` — resolver joins the unique row.
- `workflows(status: [...])` query — powers a "needs review" surface.
- `triggerWorkflow(movementId)` — §4.
- `answerWorkflow(workflowId, content: String, optionId: String?)` — appends
  the user message, sets status `queued`; the worker resumes with the
  transcript.
- Real-time via the existing `events` subscription; catch-up via the existing
  `events(lastSync)` replay. Nothing new to invent client-side.

## 9. UI (per the design system)

- **Movements table** — a quiet per-row mark, only when attention is needed
  (no mark for `succeeded`/`cancelled`; the movement's own reconciled state
  already shows the result):
  - `pending`: violet `CircleHelp` (the action color = "the assistant needs
    you"),
  - `failed`: destructive `CircleAlert`,
  - `running`: muted pulsing dot (with `prefers-reduced-motion` fallback).
- **"Needs review" filter** on the movements table (`pending` + `failed`).
- **Movement page — Assistant panel**: hairline-bordered section with the
  transcript (assistant bubbles, user answers), an answer composer with option
  chips when the last message has options, the result summary (links to the
  created activities, amounts), and `Run` / `Retry` ghost actions. No new
  visual vocabulary; no celebration when it succeeds — the ledger marks.
- **Activity page**: the existing history timeline already records creation;
  entries carry the harness `clientId` so attribution is visible.

## 10. Configuration & failure modes

Env vars (self-hosted, user brings their own key):

- `HARNESS_ENABLED` (default off), `HARNESS_LLM_BASE_URL`,
  `HARNESS_LLM_API_KEY`, `HARNESS_LLM_MODEL`, `HARNESS_MAX_ATTEMPTS`,
  `HARNESS_TIMEOUT_MS`.

Failure taxonomy → user-visible outcome:

| kind            | auto-retry | UI                        |
| --------------- | ---------- | ------------------------- |
| `provider_error`| yes (N)    | failed after N, retryable |
| `timeout`       | yes (N)    | same                      |
| `max_steps`     | no         | failed, retryable         |
| `model_give_up` | no         | failed, reason shown      |
| user reconciled | —          | cancelled (quiet)         |

## 11. Phasing

- **M1 — core loop**: table + worker + auto/manual trigger + link/create/give
  up + row marks. Terminal states `succeeded`/`failed` only.
- **M2 — conversation**: `askUser`, `answerWorkflow`, Assistant panel,
  resume-with-replan, `cancelled` hook on manual reconciliation.
- **M3 — feeding & scale**: bank import via Chrome MCP + vision (separate
  pipeline that only produces movements, then M1/M2 take over), no-LLM fast
  path, bulk triggers, `pg_advisory_lock` if multi-instance.

## 12. Open questions

- Default LLM provider/model for the self-hosted distribution?
- Should auto mode also backfill on first enable (run over all incomplete
  movements), or only new movements + explicit bulk action? Leaning: explicit
  bulk action in M3.
- Transcript retention: keep forever on the workflow row, or compact after
  success (like history compaction)?
