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
  /** The category's balance in the range: revenue minus expense. */
  amount: number;
}

/**
 * The balance by category over the selected range: revenue counts as
 * plus, expense as minus, investment and neutral stay out. Compact
 * ledger rows, most significant categories first.
 */
export function CategoryBreakdown({ range }: { range: HomeDateRange }) {
  const currencyFormatter = useCurrencyFormatter();
  const activities = useActivities((state) => state.activities);
  const categories = useActivities((state) => state.activityCategories);

  const { rows, remainder } = useMemo(() => {
    const from = startOfDay(range.from);
    const to = startOfDay(range.to);

    const balances = new Map<string | null, number>();
    for (const activity of activities) {
      const day = startOfDay(activity.date);
      if (day < from || day > to) continue;
      const net =
        activity.amounts[ActivityType.REVENUE] -
        activity.amounts[ActivityType.EXPENSE];
      if (net === 0) continue;
      balances.set(
        activity.category,
        (balances.get(activity.category) ?? 0) + net,
      );
    }

    const byId = new Map(categories.map((category) => [category.id, category]));
    const all = [...balances.entries()]
      .filter(([, amount]) => amount !== 0)
      .map(([id, amount]) => {
        const category = id !== null ? byId.get(id) : undefined;
        return {
          id,
          amount,
          name: category?.name ?? "Uncategorized",
          emoji: category?.emoji ?? null,
        } satisfies CategoryRow;
      })
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const rows = all.slice(0, MAX_CATEGORIES);
    const remainder = all.slice(MAX_CATEGORIES).length;

    return { rows, remainder };
  }, [activities, categories, range.from, range.to]);

  return (
    <section aria-label="By category" className="flex min-w-0 flex-col">
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-9 shrink-0 items-center justify-between px-4 lg:px-6",
        )}
      >
        <span>By category</span>
        <Link
          to="/categories"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground lg:px-6">
          No revenue or expenses in this range.
        </p>
      ) : (
        <div>
          {rows.map((row) => {
            const body = (
              <>
                {row.emoji && <span aria-hidden>{row.emoji}</span>}
                <span className="min-w-0 truncate">{row.name}</span>
                <span className="flex-1" />
                <span
                  className={cn(
                    "font-mono text-sm font-medium tabular-nums",
                    row.amount < 0 && "text-destructive",
                  )}
                >
                  {currencyFormatter.format(row.amount)}
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
                  "flex h-9 shrink-0 items-center gap-1.5 pr-2 pl-4 text-sm lg:px-6",
                )}
              >
                {body}
              </Link>
            ) : (
              <div
                key="uncategorized"
                className="flex h-9 shrink-0 items-center gap-1.5 pr-2 pl-4 text-sm lg:px-6"
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
