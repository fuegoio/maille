import { ActivityType } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { useMemo } from "react";

import {
  ledgerHeaderClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

import type { HomeDateRange } from "./use-home-date-range";

const MAX_CATEGORIES = 6;

interface CategoryRow {
  id: string | null;
  name: string;
  emoji: string | null;
  amount: number;
}

/**
 * Where the money went in the selected range: the top expense categories,
 * each carrying its share of the range's expense total.
 */
export function CategoryBreakdown({ range }: { range: HomeDateRange }) {
  const currencyFormatter = useCurrencyFormatter();
  const activities = useActivities((state) => state.activities);
  const categories = useActivities((state) => state.activityCategories);

  const { rows, remainder, total } = useMemo(() => {
    const from = startOfDay(range.from);
    const to = startOfDay(range.to);

    const totals = new Map<string | null, number>();
    for (const activity of activities) {
      const amount = activity.amounts[ActivityType.EXPENSE];
      if (amount <= 0) continue;
      const day = startOfDay(activity.date);
      if (day < from || day > to) continue;
      totals.set(
        activity.category,
        (totals.get(activity.category) ?? 0) + amount,
      );
    }

    const total = [...totals.values()].reduce((sum, amount) => sum + amount, 0);

    const byId = new Map(categories.map((category) => [category.id, category]));
    const all = [...totals.entries()]
      .map(([id, amount]) => {
        const category = id !== null ? byId.get(id) : undefined;
        return {
          id,
          amount,
          name: category?.name ?? "Uncategorized",
          emoji: category?.emoji ?? null,
        } satisfies CategoryRow;
      })
      .sort((a, b) => b.amount - a.amount);

    const rows = all.slice(0, MAX_CATEGORIES);
    const remainder = all.slice(MAX_CATEGORIES).length;

    return { rows, remainder, total };
  }, [activities, categories, range.from, range.to]);

  return (
    <section
      aria-label="Expenses by category"
      className="flex min-w-0 flex-col"
    >
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-9 shrink-0 items-center justify-between px-4 lg:px-6",
        )}
      >
        <span>Expenses by category</span>
        <Link
          to="/categories"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {total <= 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground lg:px-6">
          No expenses in this range.
        </p>
      ) : (
        <div>
          {rows.map((row) => {
            const share = total > 0 ? (row.amount / total) * 100 : 0;
            const body = (
              <>
                <div className="flex items-center">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {row.emoji && <span aria-hidden>{row.emoji}</span>}
                    <span className="truncate">{row.name}</span>
                  </span>
                  <span className="flex-1" />
                  <span className="font-mono text-sm font-medium tabular-nums">
                    {currencyFormatter.format(row.amount)}
                  </span>
                </div>
                <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full bg-activity-expense/70"
                    style={{ width: `${share}%` }}
                  />
                </span>
              </>
            );

            return row.id !== null ? (
              <Link
                key={row.id}
                to="/categories/$id"
                params={{ id: row.id }}
                aria-label={`Open ${row.name}`}
                className={cn(
                  ledgerRowClassName,
                  "flex flex-col border-b py-2 pr-2 pl-4 text-sm last:border-b-0 lg:px-6",
                )}
              >
                {body}
              </Link>
            ) : (
              <div
                key="uncategorized"
                className="border-b py-2 pr-2 pl-4 text-sm last:border-b-0 lg:px-6"
              >
                {body}
              </div>
            );
          })}

          {remainder > 0 && (
            <p className="px-4 py-2 text-xs text-muted-foreground lg:px-6">
              + {remainder} more{remainder === 1 ? " category" : " categories"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
