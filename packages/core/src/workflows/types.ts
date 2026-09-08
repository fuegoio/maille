export type WorkflowStatus =
  | "queued"
  | "running"
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled";

export type WorkflowTrigger = "auto" | "manual";

export type WorkflowMessageRole = "assistant" | "user" | "separator";

export type WorkflowMessageOption = {
  id: string;
  label: string;
};

/**
 * A conversation turn between the AI assistant and the user, stored on the
 * workflow row and replayed as part of the workflow's sync events.
 */
export type WorkflowMessage = {
  id: string;
  role: WorkflowMessageRole;
  content: string;
  /** Answer choices offered by the assistant, when the message is a question. */
  options?: WorkflowMessageOption[];
  /** The chosen option id, on a user message answering a question. */
  optionId?: string;
  createdAt: string;
};

export type WorkflowErrorKind = "model_give_up" | "provider_error" | "timeout" | "max_steps";

export type WorkflowResult = {
  createdActivities: string[];
  linkedActivities: string[];
  error?: {
    kind: WorkflowErrorKind;
    message: string;
  };
};

/** The workflow as exchanged in sync events and served by the API. */
export type MovementWorkflow = {
  id: string;
  movement: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  attempts: number;
  messages: WorkflowMessage[];
  result: WorkflowResult | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

//
// Status machine
//

/**
 * Legal status transitions. `queued` is the only entry point for a run; a
 * workflow run always ends in `pending`, `succeeded` or `failed`, and only a
 * manual retry can revive a `failed`/`cancelled` workflow.
 */
export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["pending", "succeeded", "failed", "cancelled"],
  pending: ["running", "cancelled"],
  failed: ["queued", "cancelled"],
  cancelled: ["queued"],
  succeeded: [],
};

export const TERMINAL_WORKFLOW_STATUSES = ["succeeded", "failed", "cancelled"] as const;

export const isTerminalWorkflowStatus = (status: WorkflowStatus): boolean =>
  (TERMINAL_WORKFLOW_STATUSES as readonly string[]).includes(status);

export const canTransitionWorkflow = (from: WorkflowStatus, to: WorkflowStatus): boolean =>
  WORKFLOW_TRANSITIONS[from].includes(to);

/** Statuses on which a manual trigger resets the workflow to `queued`. */
export const RETRYABLE_WORKFLOW_STATUSES = ["succeeded", "failed", "cancelled"] as const;

export const isRetryableWorkflowStatus = (status: WorkflowStatus): boolean =>
  (RETRYABLE_WORKFLOW_STATUSES as readonly string[]).includes(status);

/** Statuses a manual user reconciliation cancels. */
export const CANCELLED_BY_USER_STATUSES = ["queued", "running", "pending"] as const;

export const isCancelledByUserReconciliation = (status: WorkflowStatus): boolean =>
  (CANCELLED_BY_USER_STATUSES as readonly string[]).includes(status);

/**
 * Tolerance used when comparing link sums to the movement amount. Link
 * amounts are cents-scale floats computed by either the model or the UI;
 * anything below this is rounding noise.
 */
export const AMOUNT_EPSILON = 0.001;

/** Sum of the movement's activity links — how much of it is allocated. */
export const allocatedAmount = (linkAmounts: number[]): number =>
  linkAmounts.reduce((sum, amount) => sum + amount, 0);

/** How much of the movement still needs to be allocated to reach `completed`. */
export const remainingAmount = (movementAmount: number, linkAmounts: number[]): number => {
  const remaining = movementAmount - allocatedAmount(linkAmounts);
  if (Math.abs(remaining) < AMOUNT_EPSILON) {
    return 0;
  }
  return remaining;
};

/** True when the movement's links fully allocate it. */
export const isFullyAllocated = (movementAmount: number, linkAmounts: number[]): boolean =>
  remainingAmount(movementAmount, linkAmounts) === 0;
