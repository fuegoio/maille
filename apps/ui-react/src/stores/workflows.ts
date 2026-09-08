import type {
  MovementWorkflow,
  WorkflowMessage,
  WorkflowStatus,
  WorkflowResult,
} from "@maille/core/harness";
import type { SyncEvent } from "@maille/core/sync";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

/**
 * Converts a GraphQL workflow response (Float timestamps, JSON-string
 * result) to the core MovementWorkflow type (ISO strings, parsed object).
 */
const deserializeWorkflow = (raw: {
  id: string;
  movement: string;
  status: string;
  trigger: string;
  attempts: number;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    options: Array<{ id: string; label: string }> | null;
    optionId: string | null;
    createdAt: number;
  }>;
  result: string | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
}): MovementWorkflow => ({
  id: raw.id,
  movement: raw.movement,
  status: raw.status as MovementWorkflow["status"],
  trigger: raw.trigger as MovementWorkflow["trigger"],
  attempts: raw.attempts,
  messages: raw.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as MovementWorkflow["messages"][number]["role"],
    content: msg.content,
    options: msg.options ?? undefined,
    optionId: msg.optionId ?? undefined,
    createdAt: new Date(msg.createdAt * 1000).toISOString(),
  })),
  result: raw.result
    ? (JSON.parse(raw.result) as MovementWorkflow["result"])
    : null,
  error: raw.error,
  createdAt: new Date(raw.createdAt * 1000).toISOString(),
  updatedAt: new Date(raw.updatedAt * 1000).toISOString(),
});
interface WorkflowsState {
  workflows: MovementWorkflow[];

  // UI state for the bottom workflow bar
  openWorkflowIds: string[];
  activeWorkflowId: string | null;
  isMinimized: boolean;

  getWorkflowById: (id: string) => MovementWorkflow | undefined;
  getWorkflowByMovement: (movementId: string) => MovementWorkflow | undefined;

  upsertWorkflow: (workflow: MovementWorkflow) => void;
  patchWorkflow: (
    id: string,
    patch: {
      status?: WorkflowStatus;
      attempts?: number;
      messages?: WorkflowMessage[];
      result?: WorkflowResult | null;
      error?: string | null;
    },
  ) => void;
  clearWorkflows: () => void;

  openWorkflow: (workflowId: string) => void;
  closeWorkflow: (workflowId: string) => void;
  minimize: () => void;
  restore: () => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: Mutation) => void;
  handleMutationError: (event: Mutation) => void;
}

export const useWorkflows = create<WorkflowsState>()(
  persist(
    (set, get) => ({
      workflows: [],
      openWorkflowIds: [],
      activeWorkflowId: null,
      isMinimized: false,

      getWorkflowById: (id) => get().workflows.find((w) => w.id === id),

      getWorkflowByMovement: (movementId) =>
        get().workflows.find((w) => w.movement === movementId),

      upsertWorkflow: (workflow) => {
        set((state) => {
          const existing = state.workflows.find((w) => w.id === workflow.id);
          if (existing) {
            return {
              workflows: state.workflows.map((w) =>
                w.id === workflow.id ? workflow : w,
              ),
            };
          }
          return { workflows: [...state.workflows, workflow] };
        });
      },

      patchWorkflow: (id, patch) => {
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...patch } : w,
          ),
        }));
      },

      clearWorkflows: () => set({ workflows: [] }),

      openWorkflow: (workflowId) => {
        set((state) => {
          const openIds = state.openWorkflowIds.includes(workflowId)
            ? state.openWorkflowIds
            : [...state.openWorkflowIds, workflowId];
          return {
            openWorkflowIds: openIds,
            activeWorkflowId: workflowId,
            isMinimized: false,
          };
        });
      },

      closeWorkflow: (workflowId) => {
        set((state) => {
          const openIds = state.openWorkflowIds.filter(
            (id) => id !== workflowId,
          );
          const wasActive = state.activeWorkflowId === workflowId;
          return {
            openWorkflowIds: openIds,
            activeWorkflowId: wasActive
              ? (openIds.at(-1) ?? null)
              : state.activeWorkflowId,
            isMinimized: wasActive ? false : state.isMinimized,
          };
        });
      },

      minimize: () => set({ isMinimized: true }),
      restore: () => set({ isMinimized: false }),

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createWorkflow") {
          get().upsertWorkflow(event.payload);
        } else if (event.type === "updateWorkflow") {
          get().patchWorkflow(event.payload.id, {
            status: event.payload.status,
            attempts: event.payload.attempts,
            messages: event.payload.messages,
            result: event.payload.result,
            error: event.payload.error,
          });
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;

        if (event.name === "triggerWorkflow") {
          const raw = (event.result as { triggerWorkflow: unknown })
            .triggerWorkflow as Parameters<typeof deserializeWorkflow>[0];
          const workflow = deserializeWorkflow(raw);
          get().upsertWorkflow(workflow);
          get().openWorkflow(workflow.id);
        }
      },

      handleMutationError: (_event: Mutation) => {},
    }),
    {
      name: "workflows",
      storage: storage,
      partialize: (state) => ({
        workflows: state.workflows,
      }),
    },
  ),
);
