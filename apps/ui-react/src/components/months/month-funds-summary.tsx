import { flattenFundTree } from "@maille/core/funds";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
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
  /** The fund currently filtering the month's activities; null is Untracked. */
  fundFilter?: string | null;
  /** Set the fund filtering the activities; undefined clears, null is Untracked. */
  onFundFilterChange?: (fund: string | null | undefined) => void;
}

export function MonthFundsSummary({
  monthDate,
  fundFilter,
  onFundFilterChange,
}: MonthFundsSummaryProps) {
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

  const renderChevron = ({
    to,
    params,
    label,
  }: {
    to: string;
    params?: Record<string, string>;
    label: string;
  }) => (
    <Link
      to={to as never}
      params={params as never}
      onClick={(event) => event.stopPropagation()}
      aria-label={label}
      className="w-0 overflow-hidden text-muted-foreground opacity-0 transition-all duration-200 group-focus-within:w-6 group-focus-within:opacity-100 group-hover:w-6 group-hover:opacity-100"
    >
      <ChevronRight className="ml-2 size-4" />
    </Link>
  );

  return (
    // The funds tree over the month, untracked closing the list as the
    // complement of the funds.
    <div className="w-full border-b px-3 py-4">
      {variations.length > 0 ? (
        <div className="space-y-1 pb-2">
          {variations.map((variation) => {
            const active = fundFilter === variation.fund.id;
            const selectFund = () =>
              onFundFilterChange?.(active ? undefined : variation.fund.id);

            return (
              <div
                key={variation.fund.id}
                role="button"
                tabIndex={0}
                onClick={selectFund}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectFund();
                  }
                }}
                className={cn(
                  "group ml-4 flex h-9 cursor-pointer items-center justify-between rounded pr-3 pl-4 text-sm transition-colors",
                  active ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <div
                  className="flex min-w-0 items-center font-medium"
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
                  <span className="truncate">{variation.fund.name}</span>
                </div>

                <div className="flex items-center">
                  <div
                    className={cn(
                      "mr-4 text-sm text-muted-foreground",
                      !active && "hidden group-hover:block",
                    )}
                  >
                    {active ? "Clear filter" : "Filter"}
                  </div>
                  {renderVariation(variation)}
                  {renderChevron({
                    to: "/funds/$id",
                    params: { id: variation.fund.id },
                    label: `Open ${variation.fund.name}`,
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ml-4 rounded py-2 pr-3 pl-4 text-sm text-muted-foreground">
          No funds yet
        </div>
      )}

      {/* Untracked is the complement of the funds, muted like elsewhere */}
      {(() => {
        const active = fundFilter === null;
        const selectFund = () =>
          onFundFilterChange?.(active ? undefined : null);

        return (
          <div
            role="button"
            tabIndex={0}
            onClick={selectFund}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectFund();
              }
            }}
            className={cn(
              "group ml-4 flex h-9 cursor-pointer items-center justify-between rounded pr-3 pl-4 text-sm transition-colors",
              active ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <div className="flex min-w-0 items-center font-medium text-muted-foreground">
              <div className="mr-2 size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
              <span className="truncate">Untracked</span>
            </div>

            <div className="flex items-center">
              <div
                className={cn(
                  "mr-4 text-sm text-muted-foreground",
                  !active && "hidden group-hover:block",
                )}
              >
                {active ? "Clear filter" : "Filter"}
              </div>
              {renderVariation(untracked)}
              {renderChevron({
                to: "/funds/untracked",
                label: "Open Untracked",
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
