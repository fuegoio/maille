import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";

import {
  ledgerAmountClassName,
  ledgerHeaderClassName,
} from "@/components/shared/ledger-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableGroupHeaderProps {
  /** The group's id, passed back on toggle. */
  id: string;
  folded: boolean;
  onToggle: (id: string) => void;
  label: string;
  shortLabel?: string;
  calendar?: boolean;
  count: number;
  /** Right-aligned group totals. */
  children?: React.ReactNode;
}

/** A foldable group label, row count and totals, shared by every ledger table. */
export function TableGroupHeader({
  id,
  folded,
  onToggle,
  label,
  shortLabel = label,
  calendar = false,
  count,
  children,
}: TableGroupHeaderProps) {
  return (
    <div
      className={cn(
        ledgerHeaderClassName,
        "flex h-9 shrink-0 items-center gap-2 pr-2 pl-4 sm:px-6",
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`${folded ? "Expand" : "Collapse"} ${label}`}
        aria-expanded={!folded}
        className="mr-1 -ml-1 text-muted-foreground"
        onClick={() => onToggle(id)}
      >
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-100 motion-reduce:transition-none",
            folded && "-rotate-90",
          )}
        />
      </Button>
      {calendar && (
        <Calendar className="hidden size-3.5 text-muted-foreground sm:block" />
      )}
      <div className="min-w-0 truncate">
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </div>
      <span
        className="shrink-0 text-muted-foreground"
        aria-label={`${count} rows`}
      >
        {count}
      </span>
      <div className="flex-1" />
      <div className={cn(ledgerAmountClassName, "font-normal")}>{children}</div>
    </div>
  );
}
