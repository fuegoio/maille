import * as React from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LinkFilterChipProps {
  active: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Toggle chip used by the link movement / link activities dialogs.
 * Active state means the filter is applied to the list.
 */
export function LinkFilterChip({
  active,
  onToggle,
  icon,
  tooltip,
  className,
  children,
}: LinkFilterChipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={active}
          onClick={onToggle}
          className={cn(
            "inline-flex h-7 max-w-48 shrink-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors",
            active
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border bg-transparent text-foreground/70 hover:bg-accent hover:text-foreground",
            className,
          )}
        >
          {icon}
          <span className="truncate">{children}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
