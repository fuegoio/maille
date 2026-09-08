import { db } from "@/database";
import { accounts, activities, movementWorkflows, movements, movementsActivities } from "@/tables";
import { addEvent } from "@/api/events";
import { env } from "@/env";
import { logger } from "@/logger";
import { ActivityType } from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";
import type { Movement } from "@maille/core/movements";
import {
  AMOUNT_EPSILON,
  remainingAmount,
  type WorkflowMessage,
  type WorkflowResult,
} from "@maille/core/harness";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { buildEvidence, findSimilarMovements, searchActivities } from "./evidence";
import { chatCompletion, LlmError, type LlmMessage } from "@maille/harness/llm";
import {
  AskUserArgs,
  CreateActivityArgs,
  FindSimilarMovementsArgs,
  GiveUpArgs,
  HARNESS_TOOLS,
  LinkMovementArgs,
  SearchActivitiesArgs,
  SYSTEM_PROMPT,
} from "@maille/harness/tools";
import { taskMessage, transcriptToLlmMessages } from "@maille/harness/prompt";
import { harnessApiKey } from "./config";
import { createActivity } from "@/services/activities";
import { linkMovementToActivity } from "@/services/movements";
import { getWorkflow, harnessClientId, type WorkflowRow } from "./store";

/**
 * The decision loop: evidence → model tool loop → terminal transition.
 * Runs are serialized per user by the queue, so every run sees the full
 * effects of all previous runs (see queue.ts).
 */

const MAX_STEPS = 10;

//
// Run state
//

type RunState = {
  workflow: WorkflowRow;
  movement: Movement;
  linkAmounts: number[];
  createdActivities: string[];
  linkedActivities: string[];
  messages: WorkflowMessage[];
};

const clientId = (state: RunState) => harnessClientId(state.workflow.user);

//
// Transcript messages
//

const assistantMessage = (state: RunState, content: string): WorkflowMessage => ({
  id: crypto.randomUUID(),
  role: "assistant",
  content,
  createdAt: new Date().toISOString(),
});

/**
 * Adds a progress message to the conversation and emits a sync event so
 * the user sees what the agent is doing in real time. Returns false (and
 * stops the loop) if the workflow was cancelled mid-run.
 */
async function addProgressMessage(state: RunState, content: string): Promise<boolean> {
  const message = assistantMessage(state, content);
  state.messages = [...state.messages, message];
  return updateWorkflowIfRunning(state, { messages: state.messages });
}

/** Human-readable description of a tool call, used when the LLM sent no narration. */
const describeToolCall = (call: { name: string; args: Record<string, unknown> }): string | null => {
  switch (call.name) {
    case "findSimilarMovements":
      return "Looking for similar movements...";
    case "searchActivities":
      return "Searching existing activities...";
    case "linkMovement":
      return "Linking to an existing activity...";
    case "createActivity": {
      const name = call.args.name;
      return typeof name === "string"
        ? `Creating activity '${name}'...`
        : "Creating a new activity...";
    }
    default:
      return null;
  }
};

const activityNames = async (userId: string, ids: string[]): Promise<Map<string, string>> => {
  const names = new Map<string, string>();
  for (const id of ids) {
    const row = (
      await db
        .select({ id: activities.id, name: activities.name })
        .from(activities)
        .where(and(eq(activities.id, id), eq(activities.user, userId)))
        .limit(1)
    )[0];
    if (row) {
      names.set(row.id, row.name);
    }
  }
  return names;
};

const resultSummary = async (state: RunState): Promise<string> => {
  const created = await activityNames(state.workflow.user, state.createdActivities);
  const linked = await activityNames(state.workflow.user, state.linkedActivities);
  const parts: string[] = [];
  if (state.createdActivities.length) {
    parts.push(
      `created ${state.createdActivities.map((id) => `'${created.get(id) ?? id}'`).join(", ")}`,
    );
  }
  if (state.linkedActivities.length) {
    parts.push(
      `linked to ${state.linkedActivities.map((id) => `'${linked.get(id) ?? id}'`).join(", ")}`,
    );
  }
  return `Movement fully allocated: I ${parts.join(" and ")}.`;
};

//
// Terminal transitions (conditional on the workflow still running)
//

async function finishSucceeded(state: RunState): Promise<boolean> {
  const message = assistantMessage(state, await resultSummary(state));
  const result: WorkflowResult = {
    createdActivities: state.createdActivities,
    linkedActivities: state.linkedActivities,
  };
  return updateWorkflowIfRunning(state, {
    status: "succeeded",
    result,
    messages: [...state.messages, message],
  });
}

async function finishFailed(
  state: RunState,
  kind: "model_give_up" | "provider_error" | "timeout" | "max_steps",
  reason: string,
  transcriptContent?: string,
): Promise<boolean> {
  const messages = transcriptContent
    ? [...state.messages, assistantMessage(state, transcriptContent)]
    : state.messages;
  return updateWorkflowIfRunning(state, {
    status: "failed",
    result: {
      createdActivities: state.createdActivities,
      linkedActivities: state.linkedActivities,
      error: { kind, message: reason },
    },
    error: reason,
    messages,
  });
}

async function pauseForQuestion(state: RunState, question: string, options?: { label: string }[]) {
  const message: WorkflowMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: question,
    ...(options?.length
      ? {
          options: options.map((option, index) => ({ id: `option-${index}`, label: option.label })),
        }
      : {}),
    createdAt: new Date().toISOString(),
  };
  return updateWorkflowIfRunning(state, {
    status: "pending",
    messages: [...state.messages, message],
  });
}

/**
 * Transition guarded on the workflow still being `running`; returns false
 * when the status moved (e.g. the user cancelled by reconciling manually).
 */
async function updateWorkflowIfRunning(
  state: RunState,
  patch: Partial<Pick<WorkflowRow, "status" | "attempts" | "messages" | "result" | "error">>,
): Promise<boolean> {
  const rows = await db
    .update(movementWorkflows)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(eq(movementWorkflows.id, state.workflow.id), eq(movementWorkflows.status, "running")),
    )
    .returning();
  const row = rows[0];
  if (!row) {
    return false;
  }
  await addEvent({
    type: "updateWorkflow",
    payload: { id: row.id, ...patch },
    createdAt: new Date(),
    clientId: clientId(state),
    user: row.user,
  });
  return true;
}

//
// Tool implementations
//

const toolError = (message: string) => ({ ok: false as const, error: message });

/** Amount must carry the movement's sign and fit in the remaining allocation. */
const validateAllocation = (
  state: RunState,
  amount: number,
): { ok: true; remaining: number } | { ok: false; error: string } => {
  const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
  if (Math.sign(amount) !== Math.sign(state.movement.amount) || amount === 0) {
    return toolError(
      `Amount must carry the movement's sign (expected ${remaining > 0 ? "positive" : "negative"}), got ${amount}.`,
    );
  }
  if (Math.abs(amount) - Math.abs(remaining) > AMOUNT_EPSILON) {
    return toolError(
      `Amount ${amount} exceeds the remaining allocation (${remaining}). Link a part of it, or askUser if unsure.`,
    );
  }
  return { ok: true, remaining };
};

const resolveAccount = async (userId: string, id: string): Promise<string | null> => {
  const row = (
    await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.user, userId)))
      .limit(1)
  )[0];
  return row?.id ?? null;
};

const firstAccountOfType = async (userId: string, type: AccountType): Promise<string | null> => {
  const row = (
    await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.user, userId), eq(accounts.type, type)))
      .limit(1)
  )[0];
  return row?.id ?? null;
};

const nameCollision = async (userId: string, name: string): Promise<string | null> => {
  const row = (
    await db
      .select({ id: activities.id, name: activities.name })
      .from(activities)
      .where(and(eq(activities.user, userId), eq(activities.name, name)))
      .limit(1)
  )[0];
  return row?.id ?? null;
};

/**
 * Builds the transaction legs for a new activity the way the UI does:
 * expense: movement account → expense account, revenue: revenue account →
 * movement account, investment: movement account → investment account,
 * neutral: both legs explicit.
 */
async function buildTransactionLegs(
  state: RunState,
  args: z.infer<typeof CreateActivityArgs>,
): Promise<{ ok: true; fromAccount: string; toAccount: string } | { ok: false; error: string }> {
  const userId = state.workflow.user;
  const movementAccount = state.movement.account;

  if (args.type === ActivityType.EXPENSE) {
    const to = args.toAccount
      ? ((await resolveAccount(userId, args.toAccount)) ?? null)
      : await firstAccountOfType(userId, AccountType.EXPENSE);
    if (!to) {
      return toolError(
        "No expense account found for this user; ask the user how to record this expense.",
      );
    }
    return { ok: true, fromAccount: movementAccount, toAccount: to };
  }

  if (args.type === ActivityType.REVENUE) {
    const from = args.fromAccount
      ? ((await resolveAccount(userId, args.fromAccount)) ?? null)
      : await firstAccountOfType(userId, AccountType.REVENUE);
    if (!from) {
      return toolError(
        "No revenue account found for this user; ask the user how to record this revenue.",
      );
    }
    return { ok: true, fromAccount: from, toAccount: movementAccount };
  }

  if (args.type === ActivityType.INVESTMENT) {
    const to = args.toAccount
      ? ((await resolveAccount(userId, args.toAccount)) ?? null)
      : await firstAccountOfType(userId, AccountType.INVESTMENT_ACCOUNT);
    if (!to) {
      return toolError(
        "No investment account found for this user; ask the user how to record this investment.",
      );
    }
    return { ok: true, fromAccount: movementAccount, toAccount: to };
  }

  if (!args.fromAccount || !args.toAccount) {
    return toolError("Neutral activities need explicit fromAccount and toAccount account ids.");
  }
  const from = await resolveAccount(userId, args.fromAccount);
  const to = await resolveAccount(userId, args.toAccount);
  if (!from || !to) {
    return toolError("Unknown fromAccount or toAccount id.");
  }
  return { ok: true, fromAccount: from, toAccount: to };
}

/**
 * Evidence given to the model at the start of every turn: the run's own
 * writes are visible immediately (serial execution), so re-planning after
 * a pause never acts on a stale world.
 */
async function executeTool(
  state: RunState,
  call: { name: string; args: Record<string, unknown> },
): Promise<{ done?: boolean; result?: unknown }> {
  switch (call.name) {
    case "findSimilarMovements": {
      const parsed = FindSimilarMovementsArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for findSimilarMovements") };
      }
      return {
        result: {
          similarMovements: await findSimilarMovements(
            state.workflow.user,
            parsed.data.name,
            state.movement.id,
          ),
        },
      };
    }

    case "searchActivities": {
      const parsed = SearchActivitiesArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for searchActivities") };
      }
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      try {
        fromDate = parsed.data.fromDate ? new Date(parsed.data.fromDate) : undefined;
        toDate = parsed.data.toDate ? new Date(parsed.data.toDate) : undefined;
      } catch {
        return { result: toolError("Invalid date argument") };
      }
      if (
        (fromDate && Number.isNaN(fromDate.getTime())) ||
        (toDate && Number.isNaN(toDate.getTime()))
      ) {
        return { result: toolError("Invalid date argument") };
      }
      return {
        result: {
          activities: await searchActivities(state.workflow.user, {
            name: parsed.data.name,
            fromDate,
            toDate,
          }),
        },
      };
    }

    case "linkMovement": {
      const parsed = LinkMovementArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for linkMovement") };
      }
      const allocation = validateAllocation(state, parsed.data.amount);
      if (!allocation.ok) {
        return { result: allocation };
      }
      const activity = (
        await db
          .select({ id: activities.id })
          .from(activities)
          .where(
            and(
              eq(activities.id, parsed.data.activityId),
              eq(activities.user, state.workflow.user),
            ),
          )
          .limit(1)
      )[0];
      if (!activity) {
        return { result: toolError(`Activity ${parsed.data.activityId} does not exist`) };
      }

      await linkMovementToActivity(state.workflow.user, clientId(state), {
        id: crypto.randomUUID(),
        movementId: state.movement.id,
        activityId: activity.id,
        amount: parsed.data.amount,
      });

      state.linkAmounts.push(parsed.data.amount);
      state.linkedActivities.push(activity.id);
      const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
      if (remaining === 0) {
        return { done: true };
      }
      return {
        result: { ok: true, linked: true, remainingToAllocate: remaining },
      };
    }

    case "createActivity": {
      const parsed = CreateActivityArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for createActivity") };
      }
      const allocation = validateAllocation(state, parsed.data.amount);
      if (!allocation.ok) {
        return { result: allocation };
      }
      const legs = await buildTransactionLegs(state, parsed.data);
      if (!legs.ok) {
        return { result: legs };
      }

      const created = await createActivity(state.workflow.user, clientId(state), {
        id: crypto.randomUUID(),
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        date: state.movement.date,
        type: parsed.data.type,
        category: parsed.data.category ?? null,
        subcategory: parsed.data.subcategory ?? null,
        transactions: [
          {
            id: crypto.randomUUID(),
            amount: Math.abs(parsed.data.amount),
            fromAccount: legs.fromAccount,
            toAccount: legs.toAccount,
          },
        ],
        movement: {
          id: crypto.randomUUID(),
          movement: state.movement.id,
          amount: parsed.data.amount,
        },
      });

      state.linkAmounts.push(parsed.data.amount);
      state.createdActivities.push(created.id);
      const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
      if (remaining === 0) {
        return { done: true };
      }
      return {
        result: { ok: true, created: created.id, remainingToAllocate: remaining },
      };
    }

    case "askUser": {
      const parsed = AskUserArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for askUser") };
      }
      await pauseForQuestion(state, parsed.data.question, parsed.data.options);
      return { done: true };
    }

    case "giveUp": {
      const parsed = GiveUpArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for giveUp") };
      }
      const reason = parsed.data.reason ?? "No clue what this movement is";
      await finishFailed(state, "model_give_up", reason, reason);
      return { done: true };
    }

    default:
      return { result: toolError(`Unknown tool ${call.name}`) };
  }
}

//
// Run lifecycle
//

async function executeRun(state: RunState): Promise<void> {
  const evidence = await buildEvidence(state.workflow.user, state.movement);

  const llmMessages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    taskMessage(evidence, remainingAmount(state.movement.amount, state.linkAmounts)),
    ...transcriptToLlmMessages(state.messages),
  ];

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await chatCompletion({
      baseUrl: env.HARNESS_LLM_BASE_URL,
      apiKey: harnessApiKey(),
      model: env.HARNESS_LLM_MODEL,
      messages: llmMessages,
      tools: HARNESS_TOOLS,
      timeoutMs: env.HARNESS_TIMEOUT_MS,
    });

    if (response.toolCalls.length === 0) {
      await finishFailed(
        state,
        "model_give_up",
        response.content ?? "The model did not decide on this movement",
        response.content ?? "I could not decide what to do with this movement.",
      );
      return;
    }

    const call = response.toolCalls[0]!;

    // Emit the agent's narration (or a tool description) to the conversation
    // so the user sees what's happening in real time.
    const progressContent = response.content ?? describeToolCall(call);
    if (progressContent) {
      const stillRunning = await addProgressMessage(state, progressContent);
      if (!stillRunning) return;
    }

    llmMessages.push({
      role: "assistant",
      content: response.content,
      toolCalls: [call],
    });

    const outcome = await executeTool(state, call);
    if (outcome.done) {
      // The tool already transitioned to a terminal or pending status when
      // relevant; only the full-allocation case still needs the transition.
      const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
      if (remaining === 0) {
        const current = await getWorkflow(state.workflow.id);
        if (current?.status === "running") {
          await finishSucceeded(state);
        }
      }
      return;
    }
    llmMessages.push({
      role: "tool",
      toolCallId: call.id,
      content: JSON.stringify(outcome.result),
    });
  }

  await finishFailed(state, "max_steps", `The model did not finish within ${MAX_STEPS} steps`);
}

const isTimeoutError = (error: unknown) => {
  if (error instanceof LlmError && error.cause instanceof Error) {
    return error.cause.name === "TimeoutError" || error.cause.name === "AbortError";
  }
  return false;
};

/**
 * Runs a queued workflow. Claims it (queued → running) with a conditional
 * update so a workflow can never run twice concurrently; the whole loop is
 * terminal-transition guarded so a user cancellation mid-run always wins.
 */
export async function runWorkflow(workflowId: string): Promise<void> {
  const workflow = await getWorkflow(workflowId);
  if (!workflow || workflow.status !== "queued") {
    return;
  }

  const claimed = await db
    .update(movementWorkflows)
    .set({ status: "running", attempts: workflow.attempts + 1, updatedAt: new Date() })
    .where(and(eq(movementWorkflows.id, workflow.id), eq(movementWorkflows.status, "queued")))
    .returning();
  const claimedRow = claimed[0];
  if (!claimedRow) {
    return;
  }
  await addEvent({
    type: "updateWorkflow",
    payload: { id: claimedRow.id, status: "running", attempts: claimedRow.attempts },
    createdAt: new Date(),
    clientId: harnessClientId(workflow.user),
    user: workflow.user,
  });

  const movementRow = (
    await db.select().from(movements).where(eq(movements.id, workflow.movement)).limit(1)
  )[0];
  if (!movementRow) {
    await db
      .update(movementWorkflows)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(movementWorkflows.id, workflow.id), eq(movementWorkflows.status, "running")));
    return;
  }

  const existingLinks = await db
    .select({ amount: movementsActivities.amount })
    .from(movementsActivities)
    .where(eq(movementsActivities.movement, workflow.movement));

  const state: RunState = {
    workflow: claimedRow,
    movement: {
      ...movementRow,
      date: movementRow.date,
      activities: [],
      status: "incomplete",
    },
    linkAmounts: existingLinks.map((link) => link.amount),
    createdActivities: [],
    linkedActivities: [],
    messages: claimedRow.messages,
  };

  const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
  if (remaining === 0) {
    const message = assistantMessage(
      state,
      "This movement is already fully reconciled — nothing to do.",
    );
    await updateWorkflowIfRunning(state, {
      status: "succeeded",
      result: { createdActivities: [], linkedActivities: [] },
      messages: [...state.messages, message],
    });
    return;
  }

  try {
    await executeRun(state);
  } catch (error) {
    const kind = isTimeoutError(error) ? "timeout" : "provider_error";
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ workflowId, error: message }, "Harness run failed");

    const fresh = await getWorkflow(workflowId);
    if (!fresh || fresh.status !== "running") {
      return;
    }
    if (fresh.attempts < env.HARNESS_MAX_ATTEMPTS) {
      const requeued = await updateWorkflowIfRunning(state, {
        status: "queued",
        error: message,
      });
      if (requeued) {
        const { scheduleRetry } = await import("./queue");
        scheduleRetry(workflowId, fresh.user);
      }
      return;
    }
    await finishFailed(state, kind, message);
  }
}
