import { ChevronRight } from "lucide-react";
import * as React from "react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";

export interface AnalyticsBreakdownRow {
  id: string;
  label: React.ReactNode;
  /** The row's signed total; share bars use its magnitude. */
  value: number;
  /** The share bar's background, a CSS color. */
  color?: string;
  /** The row is the active filter target. */
  active?: boolean;
  /** Click filters the surface to this row. */
  onSelect?: () => void;
  /** One drill level, rendered indented below. */
  children?: AnalyticsBreakdownRow[];
}

interface AnalyticsBreakdownProps {
  rows: AnalyticsBreakdownRow[];
  /** The denominator of the share bars; defaults to the sum of magnitudes. */
  total?: number;
  emptyLabel?: string;
}

/**
 * The ranked share-bar list behind every breakdown: label left, tabular
 * amount right, a thin bar carrying each row's share of the total —
 * the compact form of Linear's grouped bar charts.
 */
export function AnalyticsBreakdown({
  rows,
  total,
  emptyLabel = "Nothing in this view.",
}: AnalyticsBreakdownProps) {
  const magnitudeTotal =
    total ?? rows.reduce((sum, row) => sum + Math.abs(row.value), 0);

  if (rows.length === 0) {
    return (
      <div className="py-2 text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <div className="flex flex-col">
      {rows.map((row) => (
        <BreakdownRowView key={row.id} row={row} total={magnitudeTotal} />
      ))}
    </div>
  );
}

function BreakdownRowView({
  row,
  total,
  depth = 0,
}: {
  row: AnalyticsBreakdownRow;
  total: number;
  depth?: number;
}) {
  const currencyFormatter = useCurrencyFormatter();
  const [expanded, setExpanded] = React.useState(false);

  const hasChildren = (row.children?.length ?? 0) > 0;
  const share =
    total > 0 ? Math.min(100, (Math.abs(row.value) / total) * 100) : 0;

  const rowContent = (
    <>
      <div
        className={cn(
          "flex min-w-0 items-baseline gap-2 rounded px-2 py-1 transition-colors",
          row.onSelect && "cursor-pointer hover:bg-muted/50",
          row.active && !row.onSelect && "bg-muted",
          row.active && row.onSelect && "bg-muted hover:bg-muted",
        )}
        {...(row.onSelect
          ? {
              role: "button",
              tabIndex: 0,
              onClick: row.onSelect,
              onKeyDown: (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  row.onSelect?.();
                }
              },
            }
          : {})}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                expanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <div className="size-4 shrink-0" />
        )}

        <div className="min-w-0 truncate text-sm">{row.label}</div>

        <div className="ml-auto shrink-0 font-mono text-sm tabular-nums">
          {currencyFormatter.format(row.value)}
        </div>
      </div>

      <div className="px-2">
        <div className="flex h-1 items-center overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{
              width: `${share}%`,
              background: row.color ?? "var(--muted-foreground)",
              opacity: depth > 0 ? 0.7 : 1,
            }}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className={cn(depth > 0 && "pl-3")}>
      {rowContent}

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {row.children!.map((child) => (
            <BreakdownRowView
              key={child.id}
              row={child}
              total={total}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
