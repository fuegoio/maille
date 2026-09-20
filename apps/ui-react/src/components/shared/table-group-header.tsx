import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import * as React from "react";

import type {
  GroupMarker as GroupMarkerData,
  RowGroup,
} from "@/lib/view-grouping";

import {
  ledgerAmountClassName,
  ledgerHeaderClassName,
} from "@/components/shared/ledger-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { GroupMarker } from "./group-marker";

interface TableGroupHeaderProps {
  /** The group's id, passed back on toggle. */
  id: string;
  folded: boolean;
  onToggle: (id: string) => void;
  label: string;
  shortLabel?: string;
  /** The group's temporal phase, read against today like the months table. */
  calendar?: "past" | "current" | "future";
  marker?: GroupMarkerData;
  parent?: RowGroup["parent"];
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
  calendar,
  marker,
  parent,
  count,
  children,
}: TableGroupHeaderProps) {
  const fullLabel = parent ? `${parent.label} / ${label}` : label;
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
        aria-label={`${folded ? "Expand" : "Collapse"} ${fullLabel}`}
        aria-expanded={!folded}
        className="mr-1 -ml-1.5 text-muted-foreground"
        onClick={() => onToggle(id)}
      >
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-100 motion-reduce:transition-none",
            folded && "-rotate-90",
          )}
        />
      </Button>
      {calendar === "past" && (
        <CalendarCheck className="hidden size-3.5 text-muted-foreground sm:block" />
      )}
      {calendar === "current" && (
        <Calendar className="hidden size-3.5 text-primary sm:block" />
      )}
      {calendar === "future" && (
        <CalendarClock className="hidden size-3.5 text-muted-foreground sm:block" />
      )}
      <div className="flex min-w-0 items-center gap-2" title={fullLabel}>
        {parent && (
          <>
            <div className="flex max-w-28 min-w-0 items-center gap-1.5 sm:max-w-40">
              {parent.marker && <GroupMarker marker={parent.marker} />}
              <span className="truncate">{parent.label}</span>
            </div>
            <ChevronRight
              aria-hidden="true"
              className="size-3 shrink-0 text-muted-foreground"
            />
          </>
        )}
        {marker && <GroupMarker marker={marker} />}
        <div className="min-w-0 truncate font-medium text-foreground">
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
      </div>
      <span
        className="shrink-0 text-muted-foreground"
        aria-label={`${count} rows`}
      >
        {count}
      </span>
      <div className="flex-1" />
      <div className={cn(ledgerAmountClassName, "shrink-0 font-normal")}>
        {children}
      </div>
    </div>
  );
}
