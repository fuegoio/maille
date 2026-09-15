---
title: AI reconciliation workflows
description: The per-movement reconcile workflow — what the assistant may do, its status machine, and how to configure it.
---

Each movement can carry at most one **reconciliation workflow**: an AI assistant that reconciles the movement for you — linking it to existing activities or creating new ones — under the same exact-allocation rules you would apply by hand. It runs on the API server (or not at all, if unconfigured).

## Enabling and configuring

Workflows need an LLM provider key. Without `MISTRAL_API_KEY`, workflows are disabled — the server boots normally and the UI simply doesn't offer them. The full knob set lives in the [configuration reference](/reference/configuration/); the essentials:

| Variable                   | Default                     | Meaning                                        |
| -------------------------- | --------------------------- | ---------------------------------------------- |
| `MISTRAL_API_KEY`          | _(unset → disabled)_        | API key; absent means workflows disabled       |
| `WORKFLOWS_LLM_BASE_URL`   | `https://api.mistral.ai/v1` | OpenAI-compatible endpoint                     |
| `WORKFLOWS_LLM_MODEL`      | `glm-5-2`                   | Model used by the workflow                     |
| `WORKFLOWS_MAX_ATTEMPTS`   | `2`                         | Attempts before a workflow settles as `failed` |
| `WORKFLOWS_TIMEOUT_MS`     | `120000`                    | Per-run timeout                                |
| `WORKFLOWS_RETRY_DELAY_MS` | `5000`                      | Backoff before a provider-error retry          |

## Triggering and answering

The movement page in the UI offers to run the assistant; the underlying operations are:

```graphql
mutation {
  triggerWorkflow(movementId: "...", message: "these were the airport taxis")
}
mutation {
  answerWorkflow(id: "...", content: "...", optionId: "...")
}
```

- `triggerWorkflow` creates the movement's workflow if missing, resets failed or cancelled ones, and is a no-op on a healthy one. The optional `message` is your guidance for the run.
- `answerWorkflow` answers the workflow's pending question and resumes the run. On an already-reconciled movement, the answer becomes a follow-up conversation turn instead (rename, re-categorize, look things up — but no re-linking of a fully allocated movement).

## What the assistant may do

The workflow's tools, and only these:

- `findSimilarMovements` and `searchActivities` — look up how comparable movements were reconciled before (the strongest signal for what to create).
- `createActivity` — with a name, an amount, optionally category/subcategory and explicit account legs for investments or transfers. The counter-leg is chosen automatically otherwise: your expense account for negative amounts, your revenue account for positive ones. The activity's date is extracted from the movement name when it contains one (`"CB 15/03/2024"` → 2024-03-15, `"19/08"` → August 19 of the movement's year).
- `linkMovement` — link the movement to an existing activity with an amount.
- `editActivity` — rename or re-categorize (mostly in follow-up turns).
- `askUser` — one precise question with concrete options when the evidence is ambiguous.
- give up — a failed workflow is preferred over a wrong activity.

The rules it operates under are the ledger's: link amounts must sum **exactly** to the movement amount (carrying its sign), duplicates of existing activity names are not created (it links instead), and activity types are derived from accounts, never set manually. When a movement is linked to an existing activity, the activity's transaction amount is increased by the linked amount automatically to keep the activity reconciled.

The workflow assembles a deterministic evidence pack before its first model call: the movement, similar past movements (and how they were reconciled), activities around the movement's date and by name, and your vocabulary (accounts, categories, subcategories, projects, funds, counterparties). The model reasons over that pack, not over guesses.

## The status machine

`MovementWorkflow.status` moves through a fixed state machine:

```
queued → running → pending → running → succeeded
                            ↘ failed
                            ↘ cancelled
```

- `queued` is the only entry point for a run; runs end in `pending`, `succeeded`, or `failed`.
- `pending` means the assistant asked you a question — answer with `answerWorkflow` and it resumes.
- `failed`/`cancelled` workflows are only revived by a manual retry.
- A `succeeded` workflow can be revived by a follow-up question and settles back in `succeeded`.

On the API server, runs are serialized per user in an in-process queue: only one decision loop is ever in flight per user, so each run sees the full effects of all previous runs. A result carries `createdActivities` and `linkedActivities`, and errors carry a kind: `model_give_up`, `provider_error`, `timeout`, or `max_steps`.

## When the workflow stops

Manual reconciliation wins: a user reconciling a movement cancels any queued, running, or pending workflow on it. The assistant is an option inside the [daily loop](/guides/daily-loop/), never a gate.
