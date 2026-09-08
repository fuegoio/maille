import { addDays, eachDayOfInterval, startOfDay, subDays } from "date-fns";
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
import { getUntrackedBalanceAtDate } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

interface FundSummaryProps {
  /** The fund to summarize; null is Untracked (the null side of moves). */
  fundId: string | null;
}

export function FundSummary({ fundId }: FundSummaryProps) {
  const currencyFormatter = useCurrencyFormatter();
  const fundMoves = useFunds((state) => state.fundMoves);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);

  // A fund's balance at a date is the sum of its moves up to that day;
  // Untracked is the complement: balance accounts' total minus what funds
  // claim up to that day.
  const getFundBalanceAtDate = (date: Date) => {
    if (fundId === null) {
      if (!user) return 0;
      return getUntrackedBalanceAtDate({
        accounts,
        activities,
        fundMoves,
        date,
        startingDate: user.startingDate,
      });
    }

    return fundMoves
      .filter((m) => m.date.getTime() < addDays(startOfDay(date), 1).getTime())
      .reduce(
        (total, m) =>
          total +
          (m.toFund === fundId ? m.amount : 0) -
          (m.fromFund === fundId ? m.amount : 0),
        0,
      );
  };

  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const balance = getFundBalanceAtDate(today);
  const balancePrev = getFundBalanceAtDate(thirtyDaysAgo);

  const last30Moves = fundMoves.filter(
    (m) =>
      m.date.getTime() >= thirtyDaysAgo.getTime() &&
      (m.fromFund === fundId || m.toFund === fundId),
  );
  const last30In = last30Moves
    .filter((m) => m.toFund === fundId)
    .reduce((total, m) => total + m.amount, 0);
  const last30Out = Math.abs(
    last30Moves
      .filter((m) => m.fromFund === fundId)
      .reduce((total, m) => total + m.amount, 0),
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
        balance: getFundBalanceAtDate(date),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, fundMoves, fundId],
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
