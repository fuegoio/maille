import { AccountType } from "@maille/core/accounts";
import { startOfDay, startOfMonth } from "date-fns";
import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccounts } from "@/stores/accounts";
import { ACTIVITY_TYPES_CHART_COLOR, useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

import type { Kpi } from "./home-kpis";
import type { HomeDateRange } from "./use-home-date-range";

import { getBalanceAtDate, getFlowTotalBetweenDates } from "./ledger-metrics";

/** The balance chart stays daily; the flow charts step to monthly windows
 * past this many days, where daily bars stop being readable. */
const DAILY_GRANULARITY_MAX_DAYS = 120;

interface DayPoint {
  date: string;
  balance: number;
  revenue: number;
  expense: number;
}

/**
 * The home chart: the active KPI over the selected range — the balance as
 * a stepped line, revenue and expense as bars, daily or monthly.
 */
export function HomeChart({
  range,
  activeChart,
}: {
  range: HomeDateRange;
  activeChart: Kpi;
}) {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user!);
  const currencyFormatter = useCurrencyFormatter();
  // Axis ticks are compact so any magnitude fits the fixed Y gutter; the
  // tooltip keeps the exact amount.
  const axisCurrencyFormatter = useCurrencyFormatter("compact");

  const dailyData = useMemo<DayPoint[]>(() => {
    const from = startOfDay(range.from);
    const to = startOfDay(range.to);

    const points: DayPoint[] = [];
    for (let day = new Date(from); day <= to; day.setDate(day.getDate() + 1)) {
      const date = new Date(day);
      points.push({
        date: date.toISOString(),
        balance: getBalanceAtDate({
          accounts,
          activities,
          startingDate: user.startingDate,
          date,
        }),
        revenue: getFlowTotalBetweenDates({
          accounts,
          activities,
          startingDate: user.startingDate,
          from: date,
          to: date,
          type: AccountType.REVENUE,
        }),
        expense: getFlowTotalBetweenDates({
          accounts,
          activities,
          startingDate: user.startingDate,
          from: date,
          to: date,
          type: AccountType.EXPENSE,
        }),
      });
    }
    return points;
  }, [range, accounts, activities, user.startingDate]);

  const isDaily =
    activeChart === "balance" || dailyData.length <= DAILY_GRANULARITY_MAX_DAYS;

  const chartData = useMemo(() => {
    if (isDaily) return dailyData;

    const months = new Map<
      string,
      { date: string; revenue: number; expense: number }
    >();
    for (const point of dailyData) {
      const monthStart = startOfMonth(new Date(point.date)).toISOString();
      const month = months.get(monthStart) ?? {
        date: monthStart,
        revenue: 0,
        expense: 0,
      };
      month.revenue += point.revenue;
      month.expense += point.expense;
      months.set(monthStart, month);
    }
    return [...months.values()];
  }, [dailyData, isDaily]);

  const chartConfig = {
    views: { label: activeChart },
    value: {
      label:
        activeChart === "balance"
          ? "Balance"
          : activeChart === "revenue"
            ? "Revenue"
            : "Expense",
      color:
        activeChart === "balance"
          ? "var(--color-primary)"
          : (ACTIVITY_TYPES_CHART_COLOR[activeChart] ?? "var(--color-primary)"),
    },
  } satisfies ChartConfig;

  const barSize =
    chartData.length <= 31 ? 28 : chartData.length <= 120 ? 18 : 10;
  const tickFormatter = (value: string) => {
    const date = new Date(value);
    if (activeChart !== "balance" && !isDaily) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
    }
    if (dailyData.length <= DAILY_GRANULARITY_MAX_DAYS) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full px-2 py-4 sm:px-4"
    >
      <ComposedChart
        accessibilityLayer
        data={chartData}
        margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
      >
        <CartesianGrid strokeDasharray="2 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={48}
          tickFormatter={tickFormatter}
        />
        <YAxis
          domain={
            activeChart === "balance"
              ? ["auto", "auto"]
              : [
                  (dataMin: number) => Math.min(0, dataMin),
                  (dataMax: number) => Math.max(0, dataMax),
                ]
          }
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={76}
          tickFormatter={(value) => axisCurrencyFormatter.format(value)}
        />
        <ReferenceLine y={0} stroke="var(--color-border)" />
        <ChartTooltip
          cursor={
            activeChart === "balance"
              ? { stroke: "var(--color-border)" }
              : { fill: "var(--color-muted)", fillOpacity: 0.45 }
          }
          content={
            <ChartTooltipContent
              className="w-auto whitespace-nowrap"
              nameKey="views"
              indicator="line"
              formatter={(value) => currencyFormatter.format(value as number)}
              labelFormatter={(value) => {
                const date = new Date(value);
                if (activeChart !== "balance" && !isDaily) {
                  return date.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  });
                }
                return date.toLocaleString("default", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
          }
        />
        {activeChart === "balance" ? (
          <Line
            type="stepAfter"
            dataKey="balance"
            stroke="var(--color-value)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ) : (
          <Bar
            dataKey={activeChart}
            fill="var(--color-value)"
            fillOpacity={0.86}
            barSize={barSize}
            radius={[1, 1, 0, 0]}
            activeBar={{ fill: "var(--color-value)", fillOpacity: 1 }}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
