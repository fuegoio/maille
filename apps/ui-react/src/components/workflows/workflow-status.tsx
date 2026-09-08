import type { WorkflowStatus } from "@maille/core/workflows";

import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";

export const WORKFLOW_STATUS_CONFIG: Record<
  WorkflowStatus,
  {
    label: string;
    dotClass: string;
    textClass: string;
  }
> = {
  queued: {
    label: "Queued",
    dotClass: "bg-muted-foreground/50",
    textClass: "text-muted-foreground",
  },
  running: {
    label: "Running",
    dotClass: "bg-blue-400",
    textClass: "text-blue-400",
  },
  pending: {
    label: "Needs input",
    dotClass: "bg-orange-400",
    textClass: "text-orange-400",
  },
  succeeded: {
    label: "Completed",
    dotClass: "bg-indigo-400",
    textClass: "text-indigo-400",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-red-400",
    textClass: "text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    dotClass: "bg-muted-foreground/40",
    textClass: "text-muted-foreground",
  },
};

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
  colored?: boolean;
}

export function WorkflowStatusBadge({
  status,
  className,
  colored = false,
}: WorkflowStatusBadgeProps) {
  const config =
    WORKFLOW_STATUS_CONFIG[status] ?? WORKFLOW_STATUS_CONFIG.queued;

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-xs",
        colored ? config.textClass : "text-foreground",
        "border-current/20",
        className,
      )}
    >
      <Bot className="size-3 shrink-0" />
      {config.label}
    </span>
  );
}
