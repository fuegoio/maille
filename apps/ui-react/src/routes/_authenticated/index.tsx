import { AccountType } from "@maille/core/accounts";
import { createFileRoute } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay, startOfMonth } from "date-fns";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
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
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { PageBar } from "@/components/shared/page-bars";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccounts } from "@/stores/accounts";
import { useActivities, ACTIVITY_TYPES_CHART_COLOR } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/_authenticated/")({
  component: RouteComponent,
});

type Kpi = "balance" | "revenue" | "expense";

function RouteComponent() {
  const [activeChart, setActiveChart] = useState<Kpi>("balance");

  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user!);
  const currencyFormatter = useCurrencyFormatter();

  const nonBalanceAccountTypes = [AccountType.REVENUE, AccountType.EXPENSE];

  // Helper: cumulative balance up to a given day, or per-day total for revenue/expense
  const getDayTotal = (
    upToDate: Date,
    type: "balance" | "revenue" | "expense",
  ) => {
    const day = startOfDay(upToDate);

    if (type === "balance") {
      const startingBalance = accounts
        .filter((a) => !nonBalanceAccountTypes.includes(a.type))
        .reduce((sum, a) => sum + (a.startingBalance ?? 0), 0);

      const transactionsTotal = activities
        .filter((a) => startOfDay(a.date) <= day && a.date >= user.startingDate)
        .flatMap((a) => a.transactions)
        .reduce((sum, t) => {
          const fromAccount = accounts.find((a) => a.id === t.fromAccount);
          const toAccount = accounts.find((a) => a.id === t.toAccount);
          const fromIsBalance =
            fromAccount && !nonBalanceAccountTypes.includes(fromAccount.type);
          const toIsBalance =
            toAccount && !nonBalanceAccountTypes.includes(toAccount.type);
          if (fromIsBalance && !toIsBalance) return sum - t.amount;
          if (!fromIsBalance && toIsBalance) return sum + t.amount;
          return sum;
        }, 0);

      return startingBalance + transactionsTotal;
    }

    const targetType =
      type === "revenue" ? AccountType.REVENUE : AccountType.EXPENSE;
    const targetAccounts = accounts
      .filter((a) => a.type === targetType)
      .map((a) => a.id);

    return activities
      .filter(
        (a) =>
          startOfDay(a.date).getTime() === day.getTime() &&
          a.date >= user.startingDate,
      )
      .flatMap((a) => a.transactions)
      .filter(
        (t) =>
          targetAccounts.includes(t.fromAccount) ||
          targetAccounts.includes(t.toAccount),
      )
      .reduce((sum, t) => {
        if (targetAccounts.includes(t.fromAccount)) return sum - t.amount;
        return sum + t.amount;
      }, 0);
  };

  const days = useMemo(
    () => eachDayOfInterval({ start: user.startingDate, end: new Date() }),
    [user.startingDate],
  );

  const currentBalance = getDayTotal(new Date(), "balance");
  const totalRevenue =
    days.reduce((sum, d) => sum + getDayTotal(d, "revenue"), 0) * -1;
  const totalExpense = days.reduce(
    (sum, d) => sum + getDayTotal(d, "expense"),
    0,
  );

  // Chart data: one point per day
  const chartData = useMemo(() => {
    return days.map((date) => ({
      date: date.toISOString(),
      balance: getDayTotal(date, "balance"),
      revenue: getDayTotal(date, "revenue") * -1,
      expense: getDayTotal(date, "expense"),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, activities, accounts]);

  const flowGranularity = days.length <= 120 ? "day" : "month";
  const flowChartData = useMemo(() => {
    if (flowGranularity === "day") return chartData;

    const months = new Map<
      string,
      { date: string; revenue: number; expense: number }
    >();
    for (const point of chartData) {
      const date = startOfMonth(new Date(point.date)).toISOString();
      const month = months.get(date) ?? { date, revenue: 0, expense: 0 };
      month.revenue += point.revenue;
      month.expense += point.expense;
      months.set(date, month);
    }

    return [...months.values()];
  }, [chartData, flowGranularity]);

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

  const kpis = [
    {
      id: "balance" as Kpi,
      name: "Current balance",
      icon: ArrowRight,
      value: currentBalance,
      color: "var(--color-primary)",
    },
    {
      id: "revenue" as Kpi,
      name: "Total revenue",
      icon: TrendingUp,
      value: totalRevenue,
      color: "var(--color-activity-revenue)",
    },
    {
      id: "expense" as Kpi,
      name: "Total expense",
      icon: TrendingDown,
      value: totalExpense,
      color: "var(--color-activity-expense)",
    },
  ];

  const activeChartData = activeChart === "balance" ? chartData : flowChartData;
  const flowBarSize =
    activeChartData.length <= 31 ? 28 : activeChartData.length <= 120 ? 18 : 10;
  const chartTitle =
    activeChart === "balance"
      ? "Balance history"
      : `${flowGranularity === "day" ? "Daily" : "Monthly"} ${activeChart}`;
  const chartRange = `${user.startingDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })} — ${new Date().toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/",
    entries: [{ key: "dashboard", label: "Dashboard", target: { to: "/" } }],
  });

  return (
    <SidebarInset>
      <PageBar>
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
      </PageBar>

      <section className="border-b" aria-label="Ledger history">
        <div className="flex min-w-0 flex-col border-b sm:flex-row sm:items-stretch">
          <div
            className="flex min-w-0 flex-1 overflow-x-auto p-2"
            role="group"
            aria-label="Chart metric"
          >
            {kpis.map((kpi) => {
              const active = activeChart === kpi.id;

              return (
                <button
                  key={kpi.id}
                  type="button"
                  aria-pressed={active}
                  data-active={active}
                  className="flex min-w-36 cursor-pointer items-center gap-2 border-r px-4 py-3 text-left transition-colors
                    duration-100 last:border-r-0 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset
                    data-[active=true]:bg-muted/35 motion-reduce:transition-none"
                  style={
                    active
                      ? { boxShadow: `inset 0 -2px 0 ${kpi.color}` }
                      : undefined
                  }
                  onClick={() => setActiveChart(kpi.id)}
                >
                  <kpi.icon
                    className="size-3.5 shrink-0"
                    style={{ color: kpi.color }}
                  />
                  <span className="min-w-0">
                    <span className="block font-mono text-xs leading-none tracking-[0.04em] uppercase opacity-70">
                      {kpi.name}
                    </span>
                    <span className="mt-1 block truncate font-mono text-sm leading-none font-medium tabular-nums">
                      {currencyFormatter.format(kpi.value)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 border-t px-4 py-3 sm:border-t-0 sm:border-l">
            <span className="font-serif text-xl leading-none tracking-[-0.01em]">
              {chartTitle}
            </span>
            <span className="font-mono text-xs tracking-[0.04em] text-muted-foreground uppercase">
              {chartRange}
            </span>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full px-2 pt-6 pb-2 sm:px-4"
        >
          <ComposedChart
            accessibilityLayer
            data={activeChartData}
            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="2 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={48}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  ...(days.length <= 120
                    ? { day: "numeric" }
                    : { year: "2-digit" }),
                });
              }}
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
              tickFormatter={(value) => currencyFormatter.format(value)}
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
                  className="w-[176px]"
                  nameKey="views"
                  indicator="line"
                  formatter={(value) =>
                    currencyFormatter.format(value as number)
                  }
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleString("default", {
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
                barSize={flowBarSize}
                radius={[1, 1, 0, 0]}
                activeBar={{ fill: "var(--color-value)", fillOpacity: 1 }}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </section>
    </SidebarInset>
  );
}
