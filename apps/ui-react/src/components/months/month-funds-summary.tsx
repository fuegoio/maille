import { ArrowRight, PiggyBank } from "lucide-react";
import { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getFundBalanceAtDate, getUntrackedBalanceAtDate } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

interface MonthFundsSummaryProps {
  monthDate: Date;
}

export function MonthFundsSummary({ monthDate }: MonthFundsSummaryProps) {
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);

  const currencyFormatter = useCurrencyFormatter();

  const sortedFunds = useMemo(
    () => [...funds].sort((a, b) => a.name.localeCompare(b.name)),
    [funds],
  );

  const startOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  );
  // 1ms before the first day lands on the last day of the previous month
  const beforeMonth = new Date(startOfMonth.getTime() - 1);

  const variations = sortedFunds.map((fund) => ({
    fund,
    start: getFundBalanceAtDate(fund.id, fundMoves, beforeMonth),
    end: getFundBalanceAtDate(fund.id, fundMoves, endOfMonth),
  }));

  const total = variations.reduce(
    (totals, variation) => ({
      start: totals.start + variation.start,
      end: totals.end + variation.end,
    }),
    { start: 0, end: 0 },
  );

  const untracked = user
    ? {
        start: getUntrackedBalanceAtDate({
          accounts,
          activities,
          fundMoves,
          date: beforeMonth,
          startingDate: user.startingDate,
        }),
        end: getUntrackedBalanceAtDate({
          accounts,
          activities,
          fundMoves,
          date: endOfMonth,
          startingDate: user.startingDate,
        }),
      }
    : { start: 0, end: 0 };

  const renderVariation = ({ start, end }: { start: number; end: number }) => (
    <div className="flex items-center gap-2">
      {Math.abs(start - end) >= 0.01 && (
        <>
          <span className="font-mono text-muted-foreground">
            {currencyFormatter.format(start)}
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </>
      )}
      <div className="font-mono text-sm whitespace-nowrap">
        {currencyFormatter.format(end)}
      </div>
    </div>
  );

  return (
    <div>
      {/* Every fund, with its share of the total at the end of the month */}
      <div className="w-full border-b px-3 py-4">
        <div className="flex h-9 items-center justify-between rounded px-3">
          <div className="flex items-center">
            <PiggyBank className="mr-2 size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Funds</span>
          </div>
          {renderVariation(total)}
        </div>

        {total.end !== 0 && variations.length > 0 && (
          <div className="mt-1 mb-2 px-2">
            <div className="flex h-2 w-full items-center overflow-hidden rounded-md bg-muted transition-all hover:h-4">
              {variations.map((variation) => {
                const percentage = (variation.end / total.end) * 100;
                return (
                  <Tooltip key={variation.fund.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="h-full transition-all hover:opacity-50"
                        style={{
                          background: variation.fund.color,
                          width: `${percentage}%`,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {variation.fund.name} (
                      {Math.round(percentage * 100) / 100}
                      %)
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        {variations.length > 0 ? (
          <div className="mt-2 space-y-1 pb-2">
            {variations.map((variation) => (
              <div
                key={variation.fund.id}
                className="ml-4 rounded py-2 pr-3 pl-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center font-medium">
                    <div
                      className="mr-2 size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: variation.fund.color }}
                    />
                    {variation.fund.name}
                  </div>
                  {renderVariation(variation)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ml-4 rounded py-2 pr-3 pl-4 text-sm text-muted-foreground">
            No funds yet
          </div>
        )}
      </div>

      {/* Untracked is the complement of the funds, muted like elsewhere */}
      <div className="w-full border-b px-3 py-4">
        <div className="flex h-9 items-center justify-between rounded px-3 text-muted-foreground">
          <div className="flex items-center">
            <div className="mr-2 size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            <span className="text-sm font-medium">Untracked</span>
          </div>
          {renderVariation(untracked)}
        </div>
      </div>
    </div>
  );
}
