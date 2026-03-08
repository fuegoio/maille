import { AccountType } from "@maille/core/accounts";
import { createFileRoute } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay } from "date-fns";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
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
      .filter((a) => startOfDay(a.date).getTime() === day.getTime() && a.date >= user.startingDate)
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
          ? "var(--color-indigo-400)"
          : (ACTIVITY_TYPES_CHART_COLOR[activeChart] ??
            "var(--color-indigo-400)"),
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

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <SidebarTrigger className="mr-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="grid grid-cols-3 border-b">
        {kpis.map((kpi) => (
          <button
            key={kpi.id}
            data-active={activeChart === kpi.id}
            className="flex flex-1 cursor-pointer flex-col justify-center gap-1 border-r px-6 py-8
              text-left transition-colors last:border-r-0 hover:bg-muted/50 data-[active=true]:bg-muted/40"
            onClick={() => setActiveChart(kpi.id)}
          >
            <div className="flex items-center text-xs text-muted-foreground">
              <kpi.icon className="mr-2 size-4" />
              {kpi.name}
            </div>
            <span className="font-mono text-lg leading-none font-semibold sm:text-3xl">
              {currencyFormatter.format(kpi.value)}
            </span>
          </button>
        ))}
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[250px] w-full border-b py-4"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[160px]"
                nameKey="views"
                formatter={(value) => currencyFormatter.format(value as number)}
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
          <Bar dataKey={activeChart} fill="var(--color-value)" />
        </BarChart>
      </ChartContainer>
    </SidebarInset>
  );
}
