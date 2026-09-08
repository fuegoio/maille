import type { MovementWorkflow } from "@maille/core/harness";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const restore = useWorkflows((state) => state.restore);
  const minimize = useWorkflows((state) => state.minimize);

  const openWorkflows = openWorkflowIds
    .map((id) => workflows.find((w) => w.id === id))
    .filter(Boolean) as MovementWorkflow[];

  const activeWorkflow = activeWorkflowId
    ? workflows.find((w) => w.id === activeWorkflowId)
    : null;

  // Show the bar when there are open workflows
  if (openWorkflows.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.15, type: "keyframes", ease: "easeInOut" }}
        className="fixed right-4 bottom-4 z-50 flex flex-col"
        style={{
          width: "min(480px, calc(100vw - 2rem))",
        }}
      >
        {/* Tab bar */}
        <div className="flex items-center gap-0.5 rounded-t-lg border border-b-0 bg-muted/95 px-1 py-1 backdrop-blur">
          {openWorkflows.map((workflow) => {
            const movement = useMovements
              .getState()
              .getMovementById(workflow.movement);
            const isActive = workflow.id === activeWorkflowId;

            return (
              <div
                key={workflow.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
                  isActive
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:bg-background/50",
                )}
                onClick={() =>
                  isMinimized ? restore() : openWorkflow(workflow.id)
                }
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    WORKFLOW_STATUS_CONFIG[workflow.status].dotClass,
                    workflow.status === "running" && "animate-pulse",
                  )}
                />
                <span className="max-w-[120px] truncate">
                  {movement?.name ?? "Workflow"}
                </span>
                <button
                  className="ml-0.5 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-foreground/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWorkflow(workflow.id);
                  }}
                >
                  <X className="size-2.5" />
                </button>
              </div>
            );
          })}
          <div className="flex-1" />
          {isMinimized ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={restore}
            >
              <Plus className="size-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={minimize}
            >
              <Minus className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Conversation panel */}
        <AnimatePresence>
          {!isMinimized && activeWorkflow && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="h-80 rounded-b-lg border bg-background">
                <WorkflowTab workflow={activeWorkflow} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
