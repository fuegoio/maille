import type { Movement } from "@maille/core/movements";
import type { WorkflowMessage, WorkflowErrorKind } from "@maille/core/workflows";
import type { WorkflowRow } from "./store";

/**
 * Mutable run state passed through the decision loop. The runner creates it
 * at claim time and both the generic loop and the workflow-specific tool
 * execution read and mutate it.
 */
export type RunState = {
  workflow: WorkflowRow;
  movement: Movement;
  linkAmounts: number[];
  createdActivities: string[];
  linkedActivities: string[];
  messages: WorkflowMessage[];
};

/**
 * State-transition functions the runner exposes to the workflow-specific
 * tool execution, so tools can pause/fail/succeed without importing the
 * runner directly (avoids a circular dependency).
 */
export type RunContext = {
  pauseForQuestion: (question: string, options?: { label: string }[]) => Promise<void>;
  finishFailed: (
    kind: WorkflowErrorKind,
    reason: string,
    transcriptContent?: string,
  ) => Promise<boolean>;
};

/** Result of a single tool call in the decision loop. */
export type ToolOutcome = { done?: boolean; result?: unknown };
