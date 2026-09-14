import { AccountType } from "@maille/core/accounts";
import { createFileRoute } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay } from "date-fns";
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
      name: "Balance",
      icon: ArrowRight,
      value: currentBalance,
    },
    {
      id: "revenue" as Kpi,
      name: "Revenue",
      icon: TrendingUp,
      value: totalRevenue,
    },
    {
      id: "expense" as Kpi,
      name: "Expense",
      icon: TrendingDown,
      value: totalExpense,
    },
  ];

  const activeKpi = kpis.find((kpi) => kpi.id === activeChart)!;
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
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
      </header>

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
                  className="flex min-w-36 cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-left
                    transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none
                    data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  onClick={() => setActiveChart(kpi.id)}
                >
                  <kpi.icon className="size-3.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-mono text-[0.6875rem] leading-none tracking-[0.04em] uppercase opacity-70">
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

          <div className="flex shrink-0 items-center justify-between gap-4 border-t px-4 py-3 font-mono text-[0.6875rem] tracking-[0.04em] text-muted-foreground uppercase sm:border-t-0 sm:border-l">
            <span className="flex items-center gap-2">
              <span
                className="size-1.5 rounded-[1px]"
                style={{ backgroundColor: chartConfig.value.color }}
              />
              {activeKpi.name} history
            </span>
            <span>{chartRange}</span>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full px-2 pt-6 pb-2 sm:px-4"
        >
          <ComposedChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid vertical strokeDasharray="2 3" />
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
                  year: "2-digit",
                });
              }}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={76}
              tickFormatter={(value) => currencyFormatter.format(value)}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <ChartTooltip
              cursor={{ stroke: "var(--color-border)" }}
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
                maxBarSize={18}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </section>
    </SidebarInset>
  );
}
