import { eachDayOfInterval, startOfDay } from "date-fns";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  AnalyticsEmpty,
  AnalyticsSection,
} from "@/components/analytics/analytics-section";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { getFundMovesRows } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useViewSearch } from "@/stores/search";

const IN_OUT_CONFIG = {
  in: { label: "In", color: "var(--color-activity-revenue)" },
  out: { label: "Out", color: "var(--color-activity-expense)" },
} satisfies ChartConfig;

interface FundMovesAnalyticsProps {
  /** The fund whose moves to analyze; null is Untracked. */
  fundId: string | null;
  subtree?: boolean;
  /** Only moves whose transaction touches this account. */
  accountFilter?: string | null;
  fullView?: boolean;
}

/**
 * Fund moves analytics: the scope's boundary flows — in and out over
 * time, and by the fund on the other side of each move. Describes the
 * same set the fund moves table shows.
 */
export function FundMovesAnalytics({
  fundId,
  subtree = false,
  accountFilter = null,
  fullView = false,
}: FundMovesAnalyticsProps) {
  const currencyFormatter = useCurrencyFormatter();
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const { search } = useViewSearch();

  const moves = useMemo(() => {
    const rows = getFundMovesRows({
      activities,
      accounts,
      funds,
      fundId,
      subtree,
    });

    return rows.filter((row) => {
      if (accountFilter !== null) {
        if (
          !row.accounts ||
          (row.accounts.from !== accountFilter &&
            row.accounts.to !== accountFilter)
        ) {
          return false;
        }
      }
      if (!search) return true;
      return row.activity !== null && searchCompare(search, row.activity.name);
    });
  }, [activities, accounts, funds, fundId, subtree, accountFilter, search]);

  const totals = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    for (const move of moves) {
      if (move.direction === "in") {
        inTotal += move.amount;
      } else {
        outTotal += move.amount;
      }
    }
    return { inTotal, outTotal };
  }, [moves]);

  // The fund on the other side of each move: where the scope's money
  // came from, and where it went.
  const counterpartRows = useMemo(() => {
    const byCounterpart = new Map<
      string | null,
      { fund: (typeof funds)[number] | null; in: number; out: number }
    >();
    for (const move of moves) {
      const counterpart = move.direction === "in" ? move.fromFund : move.toFund;
      const entry = byCounterpart.get(counterpart) ?? {
        fund: funds.find((f) => f.id === counterpart) ?? null,
        in: 0,
        out: 0,
      };
      if (move.direction === "in") {
        entry.in += move.amount;
      } else {
        entry.out += move.amount;
      }
      byCounterpart.set(counterpart, entry);
    }

    return [...byCounterpart.entries()]
      .map(([counterpartId, entry]) => ({
        key: counterpartId ?? "untracked",
        fund: entry.fund,
        net: entry.in - entry.out,
        pairs: [
          { dot: "bg-green-400", amount: entry.in },
          { dot: "bg-red-400", amount: -entry.out },
        ],
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [moves, funds]);

  const trendData = useMemo(() => {
    if (moves.length === 0) return [];

    const dates = moves.map((m) => startOfDay(m.date).getTime());
    const first = new Date(Math.min(...dates));
    const last = new Date(Math.max(...dates));
    const days = eachDayOfInterval({ start: first, end: last });

    return days.map((day) => {
      const entry = { date: day.toISOString(), in: 0, out: 0 };
      for (const move of moves) {
        if (startOfDay(move.date).getTime() === day.getTime()) {
          entry[move.direction] += move.amount;
        }
      }
      return entry;
    });
  }, [moves]);

  return (
    <div className={cn(fullView && "mx-auto w-full max-w-5xl")}>
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-4">
        <div className="text-sm text-muted-foreground">
          {moves.length} {moves.length === 1 ? "move" : "moves"}
        </div>
        <div className="flex-1" />
        <AmountPairsValue
          pairs={[
            { dot: "bg-green-400", amount: totals.inTotal },
            { dot: "bg-red-400", amount: -totals.outTotal },
          ]}
          className="text-sm"
        />
      </div>

      <AnalyticsSection title="Over time">
        {trendData.length > 0 ? (
          <ChartContainer
            config={IN_OUT_CONFIG}
            className={cn(
              "aspect-auto w-full",
              fullView ? "h-[240px]" : "h-[160px]",
            )}
          >
            <BarChart
              accessibilityLayer
              data={trendData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical strokeDasharray="2 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                minTickGap={24}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    formatter={(value) =>
                      currencyFormatter.format(value as number)
                    }
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              <Bar
                dataKey="in"
                fill="var(--color-in)"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="out"
                fill="var(--color-out)"
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <AnalyticsEmpty>No move in this view.</AnalyticsEmpty>
        )}
      </AnalyticsSection>

      <AnalyticsSection title="By counterpart fund">
        {counterpartRows.length > 0 ? (
          <div className="flex flex-col">
            {counterpartRows.map((row) => (
              <div
                key={row.key}
                className="flex min-w-0 items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <div
                  className="size-3 shrink-0 rounded-sm"
                  style={
                    row.fund
                      ? { backgroundColor: row.fund.color }
                      : {
                          backgroundColor:
                            "color-mix(in srgb, currentColor 40%, transparent)",
                        }
                  }
                />
                <div className="min-w-0 truncate text-sm">
                  {row.fund ? row.fund.name : "Untracked"}
                </div>
                <AmountPairsValue
                  pairs={row.pairs}
                  className="ml-auto text-sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <AnalyticsEmpty>No move in this view.</AnalyticsEmpty>
        )}
      </AnalyticsSection>
    </div>
  );
}
