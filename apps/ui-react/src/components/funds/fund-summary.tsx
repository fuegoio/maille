import { AccountType, type Account } from "@maille/core/accounts";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getAccountTypeShadeColor } from "@/lib/account-progress-color";
import { cn } from "@/lib/utils";
import {
  getAllocationsLandedBetweenDates,
  getFundChildren,
  getFundDirectBalance,
  getFundSpreadAcrossAccounts,
  getFundTreeBalanceAtDate,
  getFundTreeFlowsBetweenDates,
  getUntrackedBalanceAtDate,
  getUntrackedByAccountAtDate,
} from "@/logic/funds";
import {
  useAccounts,
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
} from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

interface FundSummaryProps {
  /** The fund to summarize; null is Untracked (the null side of moves). */
  fundId: string | null;
}

interface AccountSpreadEntry {
  account: Account;
  amount: number;
}

// Balance types first, P&L last, mirroring the periods accounts summary.
const ACCOUNT_SPREAD_TYPE_ORDER = [
  AccountType.BANK_ACCOUNT,
  AccountType.INVESTMENT_ACCOUNT,
  AccountType.CASH,
  AccountType.LIABILITIES,
  AccountType.ASSETS,
  AccountType.EXPENSE,
  AccountType.REVENUE,
];

export function FundSummary({ fundId }: FundSummaryProps) {
  const currencyFormatter = useCurrencyFormatter();
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();

  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  const positionsInput = useMemo(
    () =>
      user
        ? {
            accounts,
            activities,
            funds,
            fundMoves,
            fundAllocations,
            startingDate: user.startingDate,
          }
        : null,
    [user, accounts, activities, funds, fundMoves, fundAllocations],
  );

  // A real fund's numbers are its subtree's: money that entered the tree
  // minus money that left it. Untracked is the complement: balance accounts'
  // total minus what funds claim.
  const getFundBalanceAtDate = (date: Date) => {
    if (!user) return 0;
    if (fundId === null) {
      return getUntrackedBalanceAtDate({
        accounts,
        activities,
        funds,
        fundMoves,
        fundAllocations,
        date,
        startingDate: user.startingDate,
      });
    }

    return getFundTreeBalanceAtDate(
      fundId,
      funds,
      fundMoves,
      fundAllocations,
      user.startingDate,
      date,
    );
  };

  const balance = getFundBalanceAtDate(today);
  const balancePrev = getFundBalanceAtDate(thirtyDaysAgo);

  const flows =
    fundId === null || !user
      ? {
          in: fundMoves
            .filter(
              (m) =>
                m.date.getTime() >= thirtyDaysAgo.getTime() &&
                m.toFund === null &&
                m.fromFund !== null,
            )
            .reduce((total, m) => total + m.amount, 0),
          // New opening allocations claim money out of Untracked.
          out:
            fundMoves
              .filter(
                (m) =>
                  m.date.getTime() >= thirtyDaysAgo.getTime() &&
                  m.fromFund === null &&
                  m.toFund !== null,
              )
              .reduce((total, m) => total + m.amount, 0) +
            (user
              ? getAllocationsLandedBetweenDates(
                  funds,
                  fundAllocations,
                  user.startingDate,
                  thirtyDaysAgo,
                  today,
                )
              : 0),
        }
      : getFundTreeFlowsBetweenDates(
          fundId,
          funds,
          fundMoves,
          fundAllocations,
          user.startingDate,
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
    fundId === null
      ? null
      : getFundDirectBalance(fundId, fundMoves, fundAllocations);

  const childBalances = useMemo(
    () =>
      new Map(
        children.map((child) => [
          child.id,
          // A child row carries its own subtree rollup, one level deeper.
          user
            ? getFundTreeBalanceAtDate(
                child.id,
                funds,
                fundMoves,
                fundAllocations,
                user.startingDate,
                today,
              )
            : 0,
        ]),
      ),
    [children, funds, fundMoves, fundAllocations, user, today],
  );

  // Where the money sits: a fund spread across accounts, or Untracked
  // spread across accounts — the two questions positions answer.
  const accountSpread = useMemo<AccountSpreadEntry[]>(() => {
    if (!positionsInput) return [];
    const spread =
      fundId === null
        ? [
            ...getUntrackedByAccountAtDate({
              ...positionsInput,
              date: today,
            }).entries(),
          ]
            .filter(([, amount]) => Math.abs(amount) >= 0.01)
            .map(([accountId, amount]) => [accountId, amount] as const)
        : [
            ...getFundSpreadAcrossAccounts({
              ...positionsInput,
              fundId,
            }).entries(),
          ]
            .filter(([, amount]) => Math.abs(amount) >= 0.01)
            .map(([accountId, amount]) => [accountId, amount] as const);
    return accounts
      .filter((account) =>
        spread.some(([accountId]) => accountId === account.id),
      )
      .map((account) => ({
        account,
        amount:
          spread.find(([accountId]) => accountId === account.id)?.[1] ?? 0,
      }));
  }, [positionsInput, fundId, accounts, today]);

  // Accounts grouped by type, ordered and shaded like the periods accounts
  // summary. Negative positions still get a row, but only positive amounts
  // take bar width — a negative share has no meaningful physical proportion.
  const accountSpreadByType = useMemo(() => {
    const groups = new Map<AccountType, AccountSpreadEntry[]>();
    for (const entry of accountSpread) {
      const list = groups.get(entry.account.type);
      if (list) {
        list.push(entry);
      } else {
        groups.set(entry.account.type, [entry]);
      }
    }
    return ACCOUNT_SPREAD_TYPE_ORDER.filter((type) => groups.has(type)).map(
      (type) => {
        const entries = groups.get(type)!;
        return {
          type,
          entries,
          total: entries.reduce((total, { amount }) => total + amount, 0),
          positiveTotal: entries.reduce(
            (total, { amount }) => total + Math.max(0, amount),
            0,
          ),
        };
      },
    );
  }, [accountSpread]);

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
    [
      days,
      fundMoves,
      fundAllocations,
      fundId,
      funds,
      accounts,
      activities,
      user,
    ],
  );

  const chartConfig = {
    views: { label: "Balance" },
    balance: {
      label: "Balance",
      color: "var(--color-indigo-400)",
    },
  } satisfies ChartConfig;

  return (
    <div className="w-full">
      <div className="border-b p-6">
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

        {accountSpreadByType.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-medium text-muted-foreground">
              {fundId === null
                ? "Untracked across accounts"
                : "Across accounts"}
            </div>
            <div className="mt-2 space-y-3">
              {accountSpreadByType.map(
                ({ type, entries, total, positiveTotal }) => (
                  <div key={type}>
                    <div className="flex h-8 items-center">
                      <div
                        className={cn(
                          "mr-2 size-3 shrink-0 rounded-full",
                          ACCOUNT_TYPES_COLOR[type],
                        )}
                      />
                      <div className="text-sm font-medium">
                        {ACCOUNT_TYPES_NAME[type]}
                      </div>
                      <div className="flex-1" />
                      <div className="font-mono text-sm">
                        {currencyFormatter.format(total)}
                      </div>
                    </div>

                    {positiveTotal > 0 && (
                      <div className="my-1 px-0.5">
                        <div className="flex h-2 w-full items-center overflow-hidden rounded-md bg-muted transition-all hover:h-4">
                          {entries.map((entry, index) => {
                            const amount = Math.max(0, entry.amount);
                            if (amount < 0.01) return null;
                            const percentage = (amount / positiveTotal) * 100;
                            return (
                              <Tooltip key={entry.account.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    className="h-full transition-all hover:opacity-50"
                                    style={{
                                      background: getAccountTypeShadeColor(
                                        type,
                                        index,
                                        entries.length,
                                      ).toString(),
                                      width: `${percentage}%`,
                                    }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {entry.account.name} (
                                  {Math.round(percentage * 100) / 100}%)
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {entries.map(({ account, amount }) => (
                      <div
                        key={account.id}
                        className="flex h-8 cursor-pointer items-center rounded pr-3 pl-4 text-sm transition-colors hover:bg-muted/50"
                        onClick={() =>
                          navigate({
                            to: "/accounts/$id",
                            params: { id: account.id },
                          })
                        }
                      >
                        <div className="truncate">{account.name}</div>
                        <div className="flex-1" />
                        <div className="font-mono">
                          {currencyFormatter.format(amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[180px] w-full border-b p-3"
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

      {/* The fund's own money plus its direct subfunds, the subtree split of
          the balance above. */}
      {children.length > 0 && (
        <div className="border-b p-6">
          <div className="text-xs font-medium text-muted-foreground">
            Subfunds
          </div>
          <div className="mt-2">
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
                className="flex h-8 cursor-pointer items-center rounded pr-3 text-sm transition-colors hover:bg-muted/50"
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
  );
}
