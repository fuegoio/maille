import { flattenFundTree } from "@maille/core/funds";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import {
  getFundTreeBalanceAtDate,
  getUntrackedBalanceAtDate,
} from "@/logic/funds";
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
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);

  const currencyFormatter = useCurrencyFormatter();

  const nodes = useMemo(() => flattenFundTree(funds), [funds]);

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

  // Every row shows its subtree rollup, like the funds table: money in the
  // fund plus everything nested under it, at the month's boundaries.
  const variations = nodes.map(({ fund, depth }) => ({
    fund,
    depth,
    start: user
      ? getFundTreeBalanceAtDate(
          fund.id,
          funds,
          fundMoves,
          fundAllocations,
          user.startingDate,
          beforeMonth,
        )
      : 0,
    end: user
      ? getFundTreeBalanceAtDate(
          fund.id,
          funds,
          fundMoves,
          fundAllocations,
          user.startingDate,
          endOfMonth,
        )
      : 0,
  }));

  const untracked = user
    ? {
        start: getUntrackedBalanceAtDate({
          accounts,
          activities,
          funds,
          fundMoves,
          fundAllocations,
          date: beforeMonth,
          startingDate: user.startingDate,
        }),
        end: getUntrackedBalanceAtDate({
          accounts,
          activities,
          funds,
          fundMoves,
          fundAllocations,
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
    // The funds tree over the month, untracked closing the list as the
    // complement of the funds.
    <div className="w-full border-b px-3 py-4">
      {variations.length > 0 ? (
        <div className="space-y-1 pb-2">
          {variations.map((variation) => (
            <div
              key={variation.fund.id}
              className="ml-4 rounded py-2 pr-3 pl-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center font-medium"
                  style={
                    variation.depth > 0
                      ? { paddingLeft: `${variation.depth * 20}px` }
                      : undefined
                  }
                >
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

      {/* Untracked is the complement of the funds, muted like elsewhere */}
      <div className="ml-4 rounded py-2 pr-3 pl-4 transition-colors hover:bg-muted/50">
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center font-medium">
            <div className="mr-2 size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            <span className="text-sm">Untracked</span>
          </div>
          {renderVariation(untracked)}
        </div>
      </div>
    </div>
  );
}
