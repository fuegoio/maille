import { eachDayOfInterval, startOfDay, subDays } from "date-fns";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";

interface AccountSummaryProps {
  accountId: string;
}

export function AccountSummary({ accountId }: AccountSummaryProps) {
  const currencyFormatter = useCurrencyFormatter();
  const account = useAccounts((state) => state.getAccountById(accountId));
  const activities = useActivities((state) => state.activities);

  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const getAccountTotal = ({
    date,
    flow,
    rangeStart,
  }: {
    date?: Date;
    flow?: "in" | "out";
    rangeStart?: Date;
  }) => {
    const transactionsTotal = activities
      .filter((a) => {
        const d = startOfDay(a.date);
        if (rangeStart && d < rangeStart) return false;
        if (!date) return true;
        return d <= date;
      })
      .flatMap((a) => a.transactions)
      .filter(
        (t) =>
          ((flow === "in" || flow === undefined) &&
            t.toAccount === accountId) ||
          ((flow === "out" || flow === undefined) &&
            t.fromAccount === accountId),
      )
      .reduce((acc, t) => {
        if (t.fromAccount === accountId) return acc - t.amount;
        return acc + t.amount;
      }, 0);

    if (flow) return transactionsTotal;
    return (account?.startingBalance ?? 0) + transactionsTotal;
  };

  const balance = getAccountTotal({});
  const balancePrev = getAccountTotal({ date: thirtyDaysAgo });
  const last30In = getAccountTotal({ flow: "in", rangeStart: thirtyDaysAgo });
  const last30Out = Math.abs(
    getAccountTotal({ flow: "out", rangeStart: thirtyDaysAgo }),
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: thirtyDaysAgo, end: today }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const chartData = useMemo(
    () =>
      days.map((date) => ({
        date: date.toISOString(),
        balance: getAccountTotal({ date: startOfDay(date) }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, activities, accountId],
  );

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
            {currencyFormatter.format(balancePrev)}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
          <span className="font-mono">{currencyFormatter.format(balance)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <TrendingUp className="size-3" />
          <div className="font-medium">In</div>
          <div className="flex-1" />
          <span className="flex items-center gap-1 font-mono font-medium">
            {currencyFormatter.format(last30In)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm">
          <TrendingDown className="size-3" />
          <div className="font-medium">Out</div>
          <div className="flex-1" />
          <span className="flex items-center gap-1 font-mono font-medium">
            {currencyFormatter.format(last30Out)}
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
            minTickGap={20}
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
          <YAxis domain={["auto", "auto"]} hide />
          <Bar dataKey="balance" fill="var(--color-balance)" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
