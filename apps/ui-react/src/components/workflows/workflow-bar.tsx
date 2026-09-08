import type { MovementWorkflow } from "@maille/core/harness";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMovements } from "@/stores/movements";
import { useWorkflows } from "@/stores/workflows";

import { WORKFLOW_STATUS_CONFIG } from "./workflow-status";
import { WorkflowTab } from "./workflow-tab";

export function WorkflowBar() {
  const workflows = useWorkflows((state) => state.workflows);
  const openWorkflowIds = useWorkflows((state) => state.openWorkflowIds);
  const activeWorkflowId = useWorkflows((state) => state.activeWorkflowId);
  const isMinimized = useWorkflows((state) => state.isMinimized);
  const openWorkflow = useWorkflows((state) => state.openWorkflow);
  const closeWorkflow = useWorkflows((state) => state.closeWorkflow);
  const minimize = useWorkflows((state) => state.minimize);

  const movements = useMovements((state) => state.movements);

  const openWorkflows = openWorkflowIds
    .map((id) => workflows.find((w) => w.id === id))
    .filter(Boolean) as MovementWorkflow[];

  const activeWorkflow = activeWorkflowId
    ? workflows.find((w) => w.id === activeWorkflowId)
    : null;

  return (
    <>
      {/* Conversation panel — floats above everything */}
      <AnimatePresence>
        {!isMinimized && activeWorkflow && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed right-4 bottom-10 z-50 flex flex-col overflow-hidden rounded-lg border bg-background shadow-xl"
            style={{ width: "min(480px, calc(100vw - 2rem))", height: 400 }}
          >
            <WorkflowTab workflow={activeWorkflow} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar — conversation tabs, right-aligned */}
      <div className="flex h-9 shrink-0 items-center justify-end gap-1 px-3">
        {openWorkflows.length === 0 && (
          <span className="text-xs text-muted-foreground">No workflow</span>
        )}

        {openWorkflows.map((workflow) => {
          const movement = movements.find((m) => m.id === workflow.movement);
          const isActive = workflow.id === activeWorkflowId && !isMinimized;
          const statusConfig =
            WORKFLOW_STATUS_CONFIG[workflow.status] ??
            WORKFLOW_STATUS_CONFIG.queued;

          return (
            <div
              key={workflow.id}
              className={cn(
                "group flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() =>
                isActive ? minimize() : openWorkflow(workflow.id)
              }
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  statusConfig.dotClass,
                  workflow.status === "running" && "animate-pulse",
                )}
              />
              <Bot className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-[140px] truncate">
                {movement?.name ?? "Workflow"}
              </span>
              <button
                className="ml-0.5 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-foreground/10"
                onClick={(e) => {
                  e.stopPropagation();
                  closeWorkflow(workflow.id);
                }}
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
