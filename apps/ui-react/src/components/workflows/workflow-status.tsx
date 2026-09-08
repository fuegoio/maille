import type { WorkflowStatus } from "@maille/core/harness";

import {
  CheckCircle2,
  Clock,
  Loader2,
  Minus,
  PauseCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export const WORKFLOW_STATUS_CONFIG: Record<
  WorkflowStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    dotClass: string;
    textClass: string;
  }
> = {
  queued: {
    icon: Clock,
    label: "Queued",
    dotClass: "bg-muted-foreground/50",
    textClass: "text-muted-foreground",
  },
  running: {
    icon: Loader2,
    label: "Running",
    dotClass: "bg-blue-400",
    textClass: "text-blue-400",
  },
  pending: {
    icon: PauseCircle,
    label: "Needs input",
    dotClass: "bg-orange-400",
    textClass: "text-orange-400",
  },
  succeeded: {
    icon: CheckCircle2,
    label: "Completed",
    dotClass: "bg-indigo-400",
    textClass: "text-indigo-400",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    dotClass: "bg-red-400",
    textClass: "text-red-400",
  },
  cancelled: {
    icon: Minus,
    label: "Cancelled",
    dotClass: "bg-muted-foreground/40",
    textClass: "text-muted-foreground",
  },
};

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

export function WorkflowStatusBadge({
  status,
  className,
}: WorkflowStatusBadgeProps) {
  const config = WORKFLOW_STATUS_CONFIG[status];
  const isAnimated = status === "running";

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-xs font-medium",
        config.textClass,
        "border-current/20",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          config.dotClass,
          isAnimated && "animate-pulse",
        )}
      />
      {config.label}
    </span>
  );
}

interface WorkflowStatusIconProps {
  status: WorkflowStatus | null;
  className?: string;
}

export function WorkflowStatusIcon({
  status,
  className,
}: WorkflowStatusIconProps) {
  if (!status) return <Sparkles className={cn("size-4", className)} />;
  const config = WORKFLOW_STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Icon
      className={cn(
        "size-4",
        config.textClass,
        status === "running" && "animate-spin",
        className,
      )}
    />
  );
}
