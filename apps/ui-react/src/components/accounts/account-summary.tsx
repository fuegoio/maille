import { AccountType } from "@maille/core/accounts";
import { Link } from "@tanstack/react-router";
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
import { getAccountBalanceAtDate } from "@/logic/accounts";
import { getAccountSpreadAcrossFunds } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";
import { useMovements } from "@/stores/movements";

interface AccountSummaryProps {
  accountId: string;
}

export function AccountSummary({ accountId }: AccountSummaryProps) {
  const currencyFormatter = useCurrencyFormatter();
  const account = useAccounts((state) => state.getAccountById(accountId));
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const movements = useMovements((state) => state.movements);
  const user = useAuth((state) => state.user!);

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
  }) =>
    getAccountBalanceAtDate({
      accountId,
      date,
      flow,
      rangeStart,
      activities,
      accounts: account ? [account] : [],
      startingDate: user.startingDate,
    });

  const balance = getAccountTotal({});
  const balancePrev = getAccountTotal({ date: thirtyDaysAgo });
  const last30In = getAccountTotal({ flow: "in", rangeStart: thirtyDaysAgo });
  const last30Out = Math.abs(
    getAccountTotal({ flow: "out", rangeStart: thirtyDaysAgo }),
  );

  const getAccountCashBalanceAtDate = (date: Date): number => {
    if (!account?.movements) return 0;
    const accountMovements = movements.filter(
      (m) =>
        m.account === accountId &&
        new Date(m.date) <= date &&
        m.date >= user.startingDate,
    );
    return accountMovements.reduce(
      (acc, m) => acc + m.amount,
      account.startingCashBalance ?? 0,
    );
  };

  const cashBalance = getAccountCashBalanceAtDate(today);
  const cashBalancePrev = getAccountCashBalanceAtDate(thirtyDaysAgo);

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

  // Where this account's balance sits across funds: the other question
  // positions answer. P&L accounts hold no fund money, so they skip it.
  const fundSpread = useMemo(() => {
    if (
      !account ||
      account.type === AccountType.EXPENSE ||
      account.type === AccountType.REVENUE
    )
      return [];
    const composition = getAccountSpreadAcrossFunds({
      accounts,
      activities,
      funds,
      fundMoves,
      fundAllocations,
      accountId,
      startingDate: user.startingDate,
    });
    return [...composition.entries()]
      .filter(([fundId, amount]) => Math.abs(amount) >= 0.01 || fundId === null)
      .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : 0))
      .map(([fundId, amount]) => ({
        fund:
          fundId === null ? null : (funds.find((f) => f.id === fundId) ?? null),
        amount,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account,
    accounts,
    activities,
    funds,
    fundMoves,
    fundAllocations,
    accountId,
  ]);

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

        {account?.movements && (
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <div className="font-medium">Cash balance</div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {Math.abs(cashBalancePrev - cashBalance) >= 0.01 && (
                <>
                  <span className="font-mono">
                    {currencyFormatter.format(cashBalancePrev)}
                  </span>
                  <ArrowRight className="size-3" />
                </>
              )}
              <span className="font-mono">
                {currencyFormatter.format(cashBalance)}
              </span>
            </div>
          </div>
        )}

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

      {fundSpread.length > 1 && (
        <div className="px-6 pb-6">
          <div className="text-xs font-medium text-muted-foreground">
            Across funds
          </div>
          <div className="mt-1">
            {fundSpread.map(({ fund, amount }) => {
              const rowContent = (
                <>
                  <div
                    className="size-3 shrink-0 rounded-sm"
                    style={
                      fund
                        ? { backgroundColor: fund.color }
                        : {
                            backgroundColor:
                              "color-mix(in srgb, currentColor 40%, transparent)",
                          }
                    }
                  />
                  <div className="ml-2 truncate">
                    {fund ? fund.name : "Untracked"}
                  </div>
                  <div className="flex-1" />
                  <div className="font-mono">
                    {currencyFormatter.format(amount)}
                  </div>
                </>
              );

              return fund ? (
                <Link
                  key={fund.id}
                  to="/funds/$id"
                  params={{ id: fund.id }}
                  className="flex h-8 cursor-pointer items-center text-sm hover:bg-muted/50"
                >
                  {rowContent}
                </Link>
              ) : (
                <Link
                  key="untracked"
                  to="/funds/untracked"
                  className="flex h-8 cursor-pointer items-center text-sm hover:bg-muted/50"
                >
                  {rowContent}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
