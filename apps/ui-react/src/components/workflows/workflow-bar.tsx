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

  const movements = useMovements((state) => state.movements);

  const openWorkflows = openWorkflowIds
    .map((id) => workflows.find((w) => w.id === id))
    .filter(Boolean) as MovementWorkflow[];

  const activeWorkflow = activeWorkflowId
    ? workflows.find((w) => w.id === activeWorkflowId)
    : null;

  if (openWorkflows.length === 0) return null;

  return (
    <div className="shrink-0 border-t bg-background">
      {/* Tab strip */}
      <div className="flex h-9 items-center gap-0.5 px-1">
        {openWorkflows.map((workflow) => {
          const movement = movements.find((m) => m.id === workflow.movement);
          const isActive = workflow.id === activeWorkflowId;
          const statusConfig =
            WORKFLOW_STATUS_CONFIG[workflow.status] ??
            WORKFLOW_STATUS_CONFIG.queued;

          return (
            <div
              key={workflow.id}
              className={cn(
                "group flex h-7 cursor-pointer items-center gap-1.5 rounded px-2 text-xs transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
              onClick={() =>
                isMinimized ? restore() : openWorkflow(workflow.id)
              }
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  statusConfig.dotClass,
                  workflow.status === "running" && "animate-pulse",
                )}
              />
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
                <X className="size-2.5" />
              </button>
            </div>
          );
        })}
        <div className="flex-1" />
        {isMinimized ? (
          <Button variant="ghost" size="icon-sm" onClick={restore}>
            <Plus className="size-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={minimize}>
            <Minus className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Conversation panel */}
      <AnimatePresence initial={false}>
        {!isMinimized && activeWorkflow && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "320px" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <WorkflowTab workflow={activeWorkflow} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
