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

  // Workflows that need the user's attention (pending) and haven't been
  // opened yet. Used to show a notification chip on the tab.
  unreadWorkflowIds: string[];

  // Movements whose trigger mutation is in flight
  triggeringMovementIds: string[];

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

  setTriggering: (movementId: string) => void;
  clearTriggering: (movementId: string) => void;

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
      unreadWorkflowIds: [],
      triggeringMovementIds: [],

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
        const definedPatch = Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined),
        );
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...definedPatch } : w,
          ),
        }));
      },

      clearWorkflows: () => set({ workflows: [] }),

      setTriggering: (movementId) =>
        set((state) =>
          state.triggeringMovementIds.includes(movementId)
            ? state
            : {
                triggeringMovementIds: [
                  ...state.triggeringMovementIds,
                  movementId,
                ],
              },
        ),

      clearTriggering: (movementId) =>
        set((state) => ({
          triggeringMovementIds: state.triggeringMovementIds.filter(
            (id) => id !== movementId,
          ),
        })),

      openWorkflow: (workflowId) => {
        set((state) => {
          const openIds = state.openWorkflowIds.includes(workflowId)
            ? state.openWorkflowIds
            : [...state.openWorkflowIds, workflowId];
          return {
            openWorkflowIds: openIds,
            activeWorkflowId: workflowId,
            isMinimized: false,
            unreadWorkflowIds: state.unreadWorkflowIds.filter(
              (id) => id !== workflowId,
            ),
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
          const payload = event.payload;
          get().patchWorkflow(payload.id, {
            status: payload.status,
            attempts: payload.attempts,
            messages: payload.messages,
            result: payload.result,
            error: payload.error,
          });

          // When a workflow becomes pending, it needs the user's attention:
          // auto-open the tab and mark as unread so the chip shows.
          if (payload.status === "pending") {
            set((state) => {
              const alreadyUnread = state.unreadWorkflowIds.includes(
                payload.id,
              );
              const alreadyOpen = state.openWorkflowIds.includes(payload.id);
              return {
                unreadWorkflowIds: alreadyUnread
                  ? state.unreadWorkflowIds
                  : [...state.unreadWorkflowIds, payload.id],
                openWorkflowIds: alreadyOpen
                  ? state.openWorkflowIds
                  : [...state.openWorkflowIds, payload.id],
              };
            });
          }
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;

        if (
          event.name === "triggerWorkflow" ||
          event.name === "answerWorkflow"
        ) {
          const result = event.result as Record<string, unknown>;
          const raw = result?.[
            event.name === "triggerWorkflow"
              ? "triggerWorkflow"
              : "answerWorkflow"
          ] as Parameters<typeof deserializeWorkflow>[0] | undefined;
          if (!raw) return;
          try {
            const workflow = deserializeWorkflow(raw);
            get().upsertWorkflow(workflow);
            if (event.name === "triggerWorkflow") {
              get().openWorkflow(workflow.id);
            }
          } catch (e) {
            console.error("Failed to deserialize workflow", e);
          }
          if (event.name === "triggerWorkflow") {
            const movementId = (event.variables as { movementId?: string })
              ?.movementId;
            if (movementId) {
              get().clearTriggering(movementId);
            }
          }
        }
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "triggerWorkflow") {
          const movementId = (event.variables as { movementId?: string })
            ?.movementId;
          if (movementId) {
            get().clearTriggering(movementId);
          }
        }
      },
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
