import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { useMemo } from "react";

import { MovementLine } from "@/components/movements/movement-line";
import { ledgerHeaderClassName } from "@/components/shared/ledger-table";
import { cn } from "@/lib/utils";
import { useMovements } from "@/stores/movements";

const RECENT_COUNT = 8;

/**
 * The latest bank movements, rendered by the movements table's own row
 * component so the vocabulary stays identical.
 */
export function RecentMovements() {
  const movements = useMovements((state) => state.movements);

  const recent = useMemo(() => {
    const today = startOfDay(new Date());
    return [...movements]
      .filter((movement) => startOfDay(movement.date) <= today)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, RECENT_COUNT);
  }, [movements]);

  return (
    <section aria-label="Recent movements" className="flex min-w-0 flex-col">
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-9 shrink-0 items-center justify-between px-4 lg:px-6",
        )}
      >
        <span>Recent movements</span>
        <Link
          to="/movements"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground lg:px-6">
          No movements yet.
        </p>
      ) : (
        <div>
          {recent.map((movement) => (
            <MovementLine
              key={movement.id}
              movement={movement}
              checked={false}
              showCheckbox={false}
              onCheckedChange={() => {}}
            />
          ))}
        </div>
      )}
    </section>
  );
}
