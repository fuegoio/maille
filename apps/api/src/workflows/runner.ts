import { db } from "@/database";
import { movementWorkflows, movements, movementsActivities } from "@/tables";
import { addEvent } from "@/api/events";
import { env } from "@/env";
import { logger } from "@/logger";
import type { WorkflowMessage, WorkflowResult, WorkflowStatus } from "@maille/core/workflows";
import { remainingAmount } from "@maille/core/workflows";
import { and, eq } from "drizzle-orm";
import { chatCompletion, LlmError, type LlmMessage } from "@maille/workflows/llm";
import {
  FOLLOW_UP_SYSTEM_PROMPT,
  RECONCILE_MOVEMENT_TOOLS,
  SYSTEM_PROMPT,
} from "@maille/workflows/reconcile-movement/tools";
import { taskMessage, transcriptToLlmMessages } from "@maille/workflows/reconcile-movement/prompt";
import { workflowApiKey } from "./config";
import { getWorkflow, workflowClientId, type WorkflowRow } from "./store";
import { buildEvidence } from "./reconcile-movement/evidence";
import { executeTool, describeToolCall, resultSummary } from "./reconcile-movement/tools";
import type { RunState, RunContext } from "./types";

/**
 * The decision loop: evidence → model tool loop → terminal transition.
 * Runs are serialized per user by the queue, so every run sees the full
 * effects of all previous runs (see queue.ts).
 */

const MAX_STEPS = 10;

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
    clientId: workflowClientId(state.workflow.user),
    user: row.user,
  });
  return true;
}

//
// Follow-up conversation turns (fully reconciled movements)
//

/** True when the transcript's last message is the user's (a follow-up). */
const lastMessageIsFromUser = (messages: WorkflowMessage[]): boolean => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    if (message.role === "separator") {
      continue;
    }
    return message.role === "user";
  }
  return false;
};

/**
 * The terminal status a follow-up turn returns to, derived from the row the
 * way every write path leaves it: `error` set means the last run failed,
 * `result` set means it succeeded, neither means it was cancelled (e.g. the
 * user reconciled the movement by hand).
 */
const settledStatus = (state: RunState): WorkflowStatus =>
  state.workflow.error ? "failed" : state.workflow.result ? "succeeded" : "cancelled";

//
// Run lifecycle
//

/**
 * The decision loop: evidence → model tool loop → terminal transition. In
 * follow-up mode (the movement is already fully reconciled and the user sent
 * another message), the same loop runs with the follow-up system prompt: the
 * assistant can answer with plain text — the workflow settles back where it
 * was — or make changes with the tools, e.g. editing the created activities.
 */
async function executeRun(
  state: RunState,
  { followUp = false }: { followUp?: boolean } = {},
): Promise<void> {
  const evidence = await buildEvidence(state.workflow.user, state.movement);

  const runContext: RunContext = {
    pauseForQuestion: (question, options) =>
      pauseForQuestion(state, question, options).then(() => {}),
    finishFailed: (kind, reason, transcriptContent) =>
      finishFailed(state, kind, reason, transcriptContent),
  };

  const llmMessages: LlmMessage[] = [
    { role: "system", content: followUp ? FOLLOW_UP_SYSTEM_PROMPT : SYSTEM_PROMPT },
    taskMessage(evidence, remainingAmount(state.movement.amount, state.linkAmounts)),
    ...transcriptToLlmMessages(state.messages),
  ];

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await chatCompletion({
      baseUrl: env.WORKFLOWS_LLM_BASE_URL,
      apiKey: workflowApiKey(),
      model: env.WORKFLOWS_LLM_MODEL,
      messages: llmMessages,
      tools: RECONCILE_MOVEMENT_TOOLS,
      timeoutMs: env.WORKFLOWS_TIMEOUT_MS,
    });

    if (response.toolCalls.length === 0) {
      if (followUp) {
        // The model answered the user without acting: the turn is a plain
        // conversation and the workflow settles back where it was.
        const reply = response.content?.trim() || "I could not come up with an answer to that.";
        state.messages = [...state.messages, assistantMessage(state, reply)];
        await updateWorkflowIfRunning(state, {
          status: settledStatus(state),
          messages: state.messages,
        });
        return;
      }
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

    const outcome = await executeTool(state, runContext, call);
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

  if (followUp) {
    // The turn ran out of steps: settle back where it was, untouched — the
    // movement stays reconciled and the user can ask again.
    await updateWorkflowIfRunning(state, {
      status: settledStatus(state),
      messages: [
        ...state.messages,
        assistantMessage(
          state,
          `I could not finish that within ${MAX_STEPS} steps; the workflow is back where it was.`,
        ),
      ],
    });
    return;
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
    clientId: workflowClientId(workflow.user),
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
  if (remaining === 0 && !lastMessageIsFromUser(state.messages)) {
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
    // A queued workflow whose movement is still reconciled is a follow-up
    // conversation turn; the full tool loop runs either way.
    await executeRun(state, { followUp: remaining === 0 });
  } catch (error) {
    const kind = isTimeoutError(error) ? "timeout" : "provider_error";
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ workflowId, error: message }, "Workflow run failed");

    const fresh = await getWorkflow(workflowId);
    if (!fresh || fresh.status !== "running") {
      return;
    }
    if (remaining === 0) {
      // A failed follow-up turn settles the workflow back where it was,
      // untouched: the ledger state is unchanged and the user can ask again.
      await updateWorkflowIfRunning(state, {
        status: settledStatus(state),
        messages: [
          ...state.messages,
          assistantMessage(state, `I could not answer that: ${message}`),
        ],
      });
      return;
    }
    if (fresh.attempts < env.WORKFLOWS_MAX_ATTEMPTS) {
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
