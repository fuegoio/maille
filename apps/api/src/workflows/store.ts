import { db } from "@/database";
import { movementWorkflows, movements, movementsActivities } from "@/tables";
import { addEvent } from "@/api/events";
import { idPattern } from "@/api/idPrefix";
import {
  isFullyAllocated,
  isRetryableWorkflowStatus,
  isTerminalWorkflowStatus,
  type MovementWorkflow,
  type WorkflowMessage,
  type WorkflowStatus,
  type WorkflowTrigger,
} from "@maille/core/workflows";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";

export type WorkflowRow = typeof movementWorkflows.$inferSelect;

/** Serializes a workflow row into the shape used by sync events and GraphQL. */
export const serializeWorkflow = (row: WorkflowRow): MovementWorkflow => ({
  id: row.id,
  movement: row.movement,
  status: row.status,
  trigger: row.trigger,
  attempts: row.attempts,
  messages: row.messages,
  result: row.result ?? null,
  error: row.error,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const emitWorkflowCreated = (row: WorkflowRow, clientId: string) =>
  addEvent({
    type: "createWorkflow",
    payload: serializeWorkflow(row),
    createdAt: new Date(),
    clientId,
    user: row.user,
  });

export const emitWorkflowUpdate = (
  row: WorkflowRow,
  patch: Partial<Pick<WorkflowRow, "status" | "attempts" | "messages" | "result" | "error">>,
  clientId: string,
) =>
  addEvent({
    type: "updateWorkflow",
    payload: {
      id: row.id,
      ...patch,
    },
    createdAt: new Date(),
    clientId,
    user: row.user,
  });

export const getWorkflow = async (workflowId: string): Promise<WorkflowRow | null> => {
  const row = (
    await db
      .select()
      .from(movementWorkflows)
      .where(and(like(movementWorkflows.id, idPattern(workflowId))))
      .limit(1)
  )[0];
  return row ?? null;
};

export const getWorkflowByMovement = async (
  userId: string,
  movementId: string,
): Promise<WorkflowRow | null> => {
  const row = (
    await db
      .select()
      .from(movementWorkflows)
      .where(and(eq(movementWorkflows.movement, movementId), eq(movementWorkflows.user, userId)))
      .limit(1)
  )[0];
  return row ?? null;
};

/**
 * Claims the movement's workflow: inserts `queued` unless one already exists
 * (unique index on movement). Returns the new row, or null when a workflow
 * was already attached — one workflow per movement, ever.
 *
 * `messages` seeds the transcript (the user's initial guidance message,
 * when the workflow was started manually with one).
 */
export async function ensureWorkflow(
  userId: string,
  movementId: string,
  trigger: WorkflowTrigger,
  clientId: string,
  messages: WorkflowMessage[] = [],
): Promise<WorkflowRow | null> {
  const rows = await db
    .insert(movementWorkflows)
    .values({
      id: crypto.randomUUID(),
      user: userId,
      movement: movementId,
      status: "queued",
      trigger,
      messages,
    })
    .onConflictDoNothing({ target: movementWorkflows.movement })
    .returning();

  const row = rows[0];
  if (!row) {
    return null;
  }
  await emitWorkflowCreated(row, clientId);
  return row;
}

/**
 * Updates the workflow row and emits the matching `updateWorkflow` event.
 * The patch carries the full new state of each field.
 */
export async function updateWorkflow(
  workflowId: string,
  patch: Partial<Pick<WorkflowRow, "status" | "attempts" | "messages" | "result" | "error">>,
  clientId: string,
): Promise<WorkflowRow> {
  const rows = await db
    .update(movementWorkflows)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(movementWorkflows.id, workflowId))
    .returning();
  const row = rows[0];
  if (!row) {
    throw new Error(`Workflow ${workflowId} not found`);
  }
  await emitWorkflowUpdate(row, patch, clientId);
  return row;
}

/**
 * The user's initial guidance message for a run: the first user message of
 * the transcript, replayed to the model alongside the evidence.
 */
const hintMessage = (content: string): WorkflowMessage => ({
  id: crypto.randomUUID(),
  role: "user",
  content,
  createdAt: new Date().toISOString(),
});

/**
 * Manual (on-demand) trigger. Creates the workflow when absent, resets
 * `failed`/`cancelled` workflows to `queued` (keeping the transcript), and
 * leaves every other status untouched. When `message` is given, it is
 * recorded as the run's initial user guidance message.
 */
export async function triggerWorkflow(
  userId: string,
  movementId: string,
  clientId: string,
  message?: string | null,
): Promise<WorkflowRow> {
  const movement = (
    await db
      .select({ id: movements.id })
      .from(movements)
      .where(and(like(movements.id, idPattern(movementId)), eq(movements.user, userId)))
      .limit(1)
  )[0];
  if (!movement) {
    throw new GraphQLError("Movement not found");
  }

  const hint = message?.trim() ? hintMessage(message.trim()) : null;

  const existing = await getWorkflowByMovement(userId, movement.id);
  if (!existing) {
    const created = await ensureWorkflow(
      userId,
      movement.id,
      "manual",
      clientId,
      hint ? [hint] : [],
    );
    if (!created) {
      throw new GraphQLError("Movement already has a workflow");
    }
    return created;
  }

  if (isRetryableWorkflowStatus(existing.status)) {
    const nextMessages = [...existing.messages];
    if (nextMessages.length > 0) {
      nextMessages.push({
        id: crypto.randomUUID(),
        role: "separator" as const,
        content: "",
        createdAt: new Date().toISOString(),
      });
    }
    if (hint) {
      nextMessages.push(hint);
    }
    const messages = nextMessages.length > 0 ? nextMessages : existing.messages;
    return updateWorkflow(
      existing.id,
      { status: "queued", result: null, error: null, messages },
      clientId,
    );
  }

  return existing;
}

/**
 * True when the movement's links fully allocate it — i.e. it is reconciled.
 */
async function isMovementReconciled(userId: string, movementId: string): Promise<boolean> {
  const movement = (
    await db
      .select({ id: movements.id, amount: movements.amount })
      .from(movements)
      .where(and(like(movements.id, idPattern(movementId)), eq(movements.user, userId)))
      .limit(1)
  )[0];
  if (!movement) {
    return false;
  }
  const links = await db
    .select({ amount: movementsActivities.amount })
    .from(movementsActivities)
    .where(eq(movementsActivities.movement, movement.id));
  return isFullyAllocated(
    movement.amount,
    links.map((link) => link.amount),
  );
}

/**
 * Appends the user's answer to the workflow's transcript and re-queues the
 * run. On a `pending` workflow the answer resumes the reconcile loop (the
 * worker re-plans from fresh evidence, not by executing a stale plan). On a
 * terminal workflow whose movement is reconciled, the answer is a follow-up
 * question: the worker runs a read-only conversation turn instead, and the
 * workflow settles back where it was.
 */
export async function answerWorkflow(
  userId: string,
  workflowId: string,
  content: string,
  optionId: string | null,
  clientId: string,
): Promise<WorkflowRow> {
  const workflow = await getWorkflow(workflowId);
  if (!workflow || workflow.user !== userId) {
    throw new GraphQLError("Workflow not found");
  }
  if (workflow.status !== "pending") {
    if (!isTerminalWorkflowStatus(workflow.status)) {
      throw new GraphQLError("Workflow is not waiting for an answer");
    }
    // The conversation can continue past the reconciliation, but only once
    // there is nothing left to reconcile — otherwise the message belongs to
    // a new run started with triggerWorkflow.
    if (!(await isMovementReconciled(userId, workflow.movement))) {
      throw new GraphQLError("The movement is not reconciled; start a new run instead");
    }
  }

  const message: WorkflowMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    ...(optionId ? { optionId } : {}),
    createdAt: new Date().toISOString(),
  };

  return updateWorkflow(
    workflow.id,
    { status: "queued", messages: [...workflow.messages, message] },
    clientId,
  );
}

/**
 * Cancels the movement's active workflow when the user reconciles the
 * movement by hand. The assistant never fights the user.
 */
export async function cancelWorkflowIfActive(
  userId: string,
  movementId: string,
  clientId: string,
): Promise<WorkflowRow | null> {
  const workflow = await getWorkflowByMovement(userId, movementId);
  if (!workflow) {
    return null;
  }
  if (!["queued", "running", "pending"].includes(workflow.status)) {
    return workflow;
  }
  return updateWorkflow(workflow.id, { status: "cancelled" }, clientId);
}

/**
 * Stable client id for everything the workflow worker writes (sync events,
 * history entries): deterministic across restarts, so clients can attribute
 * workflow-made changes and the write services can recognize workflow calls
 * (they must not cancel the workflow they are completing).
 */
export const workflowClientId = (userId: string) => `workflow-${userId}`;

export const workflowStatus = async (workflowId: string): Promise<WorkflowStatus | null> =>
  (await getWorkflow(workflowId))?.status ?? null;
