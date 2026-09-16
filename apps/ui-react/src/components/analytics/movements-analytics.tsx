import type { Movement } from "@maille/core/movements";

import { eachDayOfInterval, startOfDay } from "date-fns";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
import { cn } from "@/lib/utils";

const IN_OUT_CONFIG = {
  in: { label: "In", color: "var(--color-activity-revenue)" },
  out: { label: "Out", color: "var(--color-activity-expense)" },
} satisfies ChartConfig;

interface MovementsAnalyticsProps {
  /** The movements as the table sees them: same set, same filters. */
  movements: Movement[];
  fullView?: boolean;
  /** Click-to-filter by account, wired where the tab filters by account. */
  onAccountSelect?: (account: string | null) => void;
  /** The account the tab is filtered to, if any. */
  accountFilter?: string | null;
}

/**
 * Movements analytics: reconciliation status, in/out over time and by
 * account, always describing exactly the table's current set.
 */
export function MovementsAnalytics({
  movements,
  fullView = false,
  onAccountSelect,
  accountFilter = null,
}: MovementsAnalyticsProps) {
  const currencyFormatter = useCurrencyFormatter();

  const totals = useMemo(() => {
    let inTotal = 0;
    let outTotal = 0;
    let completedTotal = 0;
    for (const movement of movements) {
      if (movement.amount >= 0) {
        inTotal += movement.amount;
      } else {
        outTotal += -movement.amount;
      }
      if (movement.status === "completed") {
        completedTotal += Math.abs(movement.amount);
      }
    }
    return { inTotal, outTotal, completedTotal };
  }, [movements]);

  const statusRows = useMemo<AnalyticsBreakdownRow[]>(() => {
    const completed = movements.filter((m) => m.status === "completed");
    const incomplete = movements.filter((m) => m.status !== "completed");
    const sum = (list: Movement[]) =>
      list.reduce((total, m) => total + Math.abs(m.amount), 0);

    return [
      {
        id: "completed",
        label: (
          <span>
            Reconciled
            <span className="ml-1.5 text-muted-foreground">
              ({completed.length})
            </span>
          </span>
        ),
        value: sum(completed),
        color: "var(--primary)",
      },
      {
        id: "incomplete",
        label: (
          <span>
            Not reconciled
            <span className="ml-1.5 text-muted-foreground">
              ({incomplete.length})
            </span>
          </span>
        ),
        value: sum(incomplete),
        color: "var(--muted-foreground)",
      },
    ];
  }, [movements]);

  const accountRows = useMemo<AnalyticsBreakdownRow[]>(() => {
    const byAccount = new Map<string, number>();
    for (const movement of movements) {
      byAccount.set(
        movement.account,
        (byAccount.get(movement.account) ?? 0) + movement.amount,
      );
    }

    return [...byAccount.entries()]
      .map(([accountId, value]) => ({
        id: accountId,
        label: <AccountLabel accountId={accountId} />,
        value,
        active: accountFilter === accountId,
        onSelect: onAccountSelect
          ? () =>
              onAccountSelect(accountFilter === accountId ? null : accountId)
          : undefined,
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [movements, accountFilter, onAccountSelect]);

  const distinctAccounts = useMemo(
    () => new Set(movements.map((m) => m.account)).size,
    [movements],
  );

  const trendData = useMemo(() => {
    if (movements.length === 0) return [];

    const dates = movements.map((m) => startOfDay(m.date).getTime());
    const first = new Date(Math.min(...dates));
    const last = new Date(Math.max(...dates));
    const days = eachDayOfInterval({ start: first, end: last });

    return days.map((day) => {
      const entry = { date: day.toISOString(), in: 0, out: 0 };
      for (const movement of movements) {
        if (startOfDay(movement.date).getTime() === day.getTime()) {
          if (movement.amount >= 0) {
            entry.in += movement.amount;
          } else {
            entry.out += -movement.amount;
          }
        }
      }
      return entry;
    });
  }, [movements]);

  return (
    <div className={cn(fullView && "mx-auto w-full max-w-5xl")}>
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-4">
        <div className="text-sm text-muted-foreground">
          {movements.length} {movements.length === 1 ? "movement" : "movements"}
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

      <AnalyticsSection title="Reconciliation">
        <AnalyticsBreakdown
          rows={statusRows}
          emptyLabel="No movement in this view."
        />
      </AnalyticsSection>

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
          <AnalyticsEmpty>No movement in this view.</AnalyticsEmpty>
        )}
      </AnalyticsSection>

      {distinctAccounts > 1 && (
        <AnalyticsSection title="By account">
          <AnalyticsBreakdown
            rows={accountRows}
            emptyLabel="No movement in this view."
          />
        </AnalyticsSection>
      )}
    </div>
  );
}
