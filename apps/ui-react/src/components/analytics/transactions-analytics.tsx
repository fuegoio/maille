import { eachDayOfInterval, startOfDay } from "date-fns";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import { AccountLabel } from "@/components/accounts/account-label";
import {
  AnalyticsBreakdown,
  type AnalyticsBreakdownRow,
} from "@/components/analytics/analytics-breakdown";
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
import { getAccountTransactions } from "@/logic/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useViewSearch } from "@/stores/search";

const IN_OUT_CONFIG = {
  in: { label: "In", color: "var(--color-activity-revenue)" },
  out: { label: "Out", color: "var(--color-activity-expense)" },
} satisfies ChartConfig;

interface TransactionsAnalyticsProps {
  accountId: string;
  /** Keep only transactions holding this fund on the account's side; null is Untracked. */
  fundFilter?: string | null;
  fullView?: boolean;
}

/**
 * The account's transactions as the analytics panel sees them: in and
 * out over time, by fund and by counterpart account — the same set the
 * transactions table shows.
 */
export function TransactionsAnalytics({
  accountId,
  fundFilter,
  fullView = false,
}: TransactionsAnalyticsProps) {
  const currencyFormatter = useCurrencyFormatter();
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);
  const { search } = useViewSearch();

  const transactions = useMemo(() => {
    const all = getAccountTransactions(activities, accountId);
    return all
      .filter((t) => searchCompare(search, t.activity.name))
      .filter((t) => (fundFilter === undefined ? true : t.fund === fundFilter));
  }, [activities, accountId, search, fundFilter]);

  const totals = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    for (const transaction of transactions) {
      if (transaction.direction === "in") {
        inTotal += transaction.amount;
      } else {
        outTotal += transaction.amount;
      }
    }
    return { inTotal, outTotal };
  }, [transactions]);

  const fundRows = useMemo<AnalyticsBreakdownRow[]>(() => {
    const byFund = new Map<string | null, { in: number; out: number }>();
    for (const transaction of transactions) {
      const entry = byFund.get(transaction.fund) ?? { in: 0, out: 0 };
      if (transaction.direction === "in") {
        entry.in += transaction.amount;
      } else {
        entry.out += transaction.amount;
      }
      byFund.set(transaction.fund, entry);
    }

    return [...byFund.entries()]
      .map(([fundId, entry]) => {
        const fund = funds.find((f) => f.id === fundId);
        return {
          id: fundId ?? "untracked",
          label: fund ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
              <span className="truncate">{fund.name}</span>
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
              <span className="truncate">Untracked</span>
            </span>
          ),
          value: entry.in - entry.out,
          color: fund?.color,
        };
      })
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [transactions, funds]);

  const counterpartRows = useMemo<AnalyticsBreakdownRow[]>(() => {
    const byCounterpart = new Map<string, { in: number; out: number }>();
    for (const transaction of transactions) {
      const entry = byCounterpart.get(transaction.counterpart) ?? {
        in: 0,
        out: 0,
      };
      if (transaction.direction === "in") {
        entry.in += transaction.amount;
      } else {
        entry.out += transaction.amount;
      }
      byCounterpart.set(transaction.counterpart, entry);
    }

    return [...byCounterpart.entries()]
      .map(([counterpartId, entry]) => ({
        id: counterpartId,
        label: <AccountLabel accountId={counterpartId} />,
        value: entry.in - entry.out,
        color:
          entry.in >= entry.out
            ? "var(--color-activity-revenue)"
            : "var(--color-activity-expense)",
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [transactions]);

  const trendData = useMemo(() => {
    if (transactions.length === 0) return [];

    const dates = transactions.map((t) => startOfDay(t.date).getTime());
    const first = new Date(Math.min(...dates));
    const last = new Date(Math.max(...dates));
    const days = eachDayOfInterval({ start: first, end: last });

    return days.map((day) => {
      const entry = { date: day.toISOString(), in: 0, out: 0 };
      for (const transaction of transactions) {
        if (startOfDay(transaction.date).getTime() === day.getTime()) {
          if (transaction.direction === "in") {
            entry.in += transaction.amount;
          } else {
            entry.out -= transaction.amount;
          }
        }
      }
      return entry;
    });
  }, [transactions]);

  return (
    <div className={cn(fullView && "mx-auto w-full max-w-5xl")}>
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-4">
        <div className="text-sm text-muted-foreground">
          {transactions.length}{" "}
          {transactions.length === 1 ? "transaction" : "transactions"}
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
            <LineChart
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
              <Line
                type="stepAfter"
                dataKey="in"
                stroke="var(--color-in)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Line
                type="stepAfter"
                dataKey="out"
                stroke="var(--color-out)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <AnalyticsEmpty>No transaction in this view.</AnalyticsEmpty>
        )}
      </AnalyticsSection>

      <AnalyticsSection title="By fund">
        <AnalyticsBreakdown
          rows={fundRows}
          emptyLabel="No transaction in this view."
        />
      </AnalyticsSection>

      <AnalyticsSection title="By counterpart">
        <AnalyticsBreakdown
          rows={counterpartRows}
          emptyLabel="No transaction in this view."
        />
      </AnalyticsSection>
    </div>
  );
}
