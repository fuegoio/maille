import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface TableGroupHeaderProps {
  /** The group's id, passed back on toggle. */
  id: string;
  folded: boolean;
  onToggle: (id: string) => void;
  month: number;
  year: number;
  /** Right-aligned group totals. */
  children?: React.ReactNode;
}

/** A month-period group header row, shared by every grouped table. */
export function TableGroupHeader({
  id,
  folded,
  onToggle,
  month,
  year,
  children,
}: TableGroupHeaderProps) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 pr-2 pl-5 sm:px-6">
      <ChevronDown
        className={cn(
          "mr-2 size-3 opacity-20 transition-all hover:opacity-100 sm:mr-3",
          folded && "-rotate-90 opacity-100",
        )}
        onClick={() => onToggle(id)}
      />
      <Calendar className="hidden size-4 sm:block" />
      <div className="text-sm">
        {new Date(year, month).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}
      </div>
      <div className="flex-1" />
      {children}
    </div>
  );
}
