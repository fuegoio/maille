import { AccountType } from "@maille/core/accounts";
import {
  eachDayOfInterval,
  endOfMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getAccountsBalance, getBalanceForMonth } from "@/logic/accounts";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

interface MonthSummaryProps {
  monthDate: Date;
}

export function MonthSummary({ monthDate }: MonthSummaryProps) {
  const currencyFormatter = useCurrencyFormatter();

  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const user = useAuth((state) => state.user!);

  const previousMonthDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1,
  );

  const revenue =
    getAccountsBalance({
      accountType: AccountType.REVENUE,
      monthDate,
      activities,
      accounts,
      startDate: user.startingDate,
    }) * -1;
  const expense = getAccountsBalance({
    accountType: AccountType.EXPENSE,
    monthDate,
    activities,
    accounts,
    startDate: user.startingDate,
  });

  const nonBalanceAccountTypes = [AccountType.REVENUE, AccountType.EXPENSE];

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const days = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthDate],
  );

  const chartData = useMemo(() => {
    return days.map((date) => {
      const day = startOfDay(date);
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

      return {
        date: date.toISOString(),
        balance: startingBalance + transactionsTotal,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, activities, accounts]);

  const chartConfig = {
    views: { label: "Balance" },
    balance: {
      label: "Balance",
      color: "var(--color-indigo-400)",
    },
  } satisfies ChartConfig;

  return (
    <div className="w-full border-b">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="font-semibold">Balance</div>
          <div className="flex-1" />
          <span className="font-mono text-muted-foreground">
            {currencyFormatter.format(
              getBalanceForMonth({
                monthDate: previousMonthDate,
                startingDate: user.startingDate,
                activities,
                accounts,
              }),
            )}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
          <span className="font-mono">
            {currencyFormatter.format(
              getBalanceForMonth({
                monthDate,
                startingDate: user.startingDate,
                activities,
                accounts,
              }),
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center text-sm">
          <div className="font-medium">Earnings</div>
          <div className="flex-1" />
          <span className="flex items-center gap-1 font-mono font-medium">
            {revenue > expense ? (
              <Plus className="size-3 text-emerald-400" />
            ) : (
              <Minus className="size-3 text-red-400" />
            )}
            {currencyFormatter.format(Math.abs(revenue - expense))}
          </span>
        </div>
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[180px] w-full border-t p-3"
      >
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={true}
            axisLine={false}
            tickMargin={4}
            minTickGap={10}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString("en-US", { day: "numeric" });
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[160px]"
                nameKey="views"
                formatter={(value) => currencyFormatter.format(value as number)}
                labelFormatter={(value) =>
                  new Date(value).toLocaleString("default", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
            }
          />
          <Bar dataKey="balance" fill="var(--color-balance)" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
