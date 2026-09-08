import { useNavigate } from "@tanstack/react-router";
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
import {
  getFundChildren,
  getFundDirectBalance,
  getFundTreeBalanceAtDate,
  getFundTreeFlowsBetweenDates,
  getUntrackedBalanceAtDate,
} from "@/logic/funds";
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
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();

  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  // A real fund's numbers are its subtree's: money that entered the tree
  // minus money that left it. Untracked is the complement: balance accounts'
  // total minus what funds claim.
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

    return getFundTreeBalanceAtDate(fundId, funds, fundMoves, date);
  };

  const balance = getFundBalanceAtDate(today);
  const balancePrev = getFundBalanceAtDate(thirtyDaysAgo);

  const flows =
    fundId === null
      ? {
          in: fundMoves
            .filter(
              (m) =>
                m.date.getTime() >= thirtyDaysAgo.getTime() &&
                m.toFund === null &&
                m.fromFund !== null,
            )
            .reduce((total, m) => total + m.amount, 0),
          out: fundMoves
            .filter(
              (m) =>
                m.date.getTime() >= thirtyDaysAgo.getTime() &&
                m.fromFund === null &&
                m.toFund !== null,
            )
            .reduce((total, m) => total + m.amount, 0),
        }
      : getFundTreeFlowsBetweenDates(
          fundId,
          funds,
          fundMoves,
          thirtyDaysAgo,
          today,
        );
  const last30In = flows.in;
  const last30Out = flows.out;

  // The breakdown splits a parent's rollup into its own money and its
  // children's subtrees.
  const children = useMemo(
    () => (fundId === null ? [] : getFundChildren(fundId, funds)),
    [fundId, funds],
  );
  const directBalance =
    fundId === null ? null : getFundDirectBalance(fundId, fundMoves);

  const childBalances = useMemo(
    () =>
      new Map(
        children.map((child) => [
          child.id,
          // A child row carries its own subtree rollup, one level deeper.
          getFundTreeBalanceAtDate(child.id, funds, fundMoves, today),
        ]),
      ),
    [children, funds, fundMoves, today],
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
    [days, fundMoves, fundId, funds],
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

        {children.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-medium text-muted-foreground">
              Breakdown
            </div>
            <div className="mt-1">
              {directBalance !== null && (
                <div className="flex h-8 items-center text-sm">
                  <div className="text-muted-foreground">This fund</div>
                  <div className="flex-1" />
                  <div className="font-mono text-muted-foreground">
                    {currencyFormatter.format(directBalance)}
                  </div>
                </div>
              )}
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex h-8 cursor-pointer items-center text-sm hover:bg-muted/50"
                  onClick={() =>
                    navigate({ to: "/funds/$id", params: { id: child.id } })
                  }
                >
                  <div
                    className="size-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: child.color }}
                  />
                  <div className="ml-2 truncate">{child.name}</div>
                  <div className="flex-1" />
                  <div className="font-mono">
                    {currencyFormatter.format(childBalances.get(child.id) ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
