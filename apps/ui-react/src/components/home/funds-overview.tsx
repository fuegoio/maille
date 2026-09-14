import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { useMemo } from "react";

import {
  ledgerHeaderClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useFundMoves } from "@/hooks/use-fund-moves";
import { cn } from "@/lib/utils";
import {
  getFundTreeBalanceAtDate,
  getUntrackedBalanceAtDate,
} from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

interface FundRow {
  id: string | null;
  name: string;
  color: string;
  balance: number;
  to: string;
  params: Record<string, string>;
}

/**
 * Where the money is held by purpose: each top-level fund's balance, with
 * Untracked closing the list as the money no fund claims.
 */
export function FundsOverview() {
  const currencyFormatter = useCurrencyFormatter();
  const funds = useFunds((state) => state.funds);
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const fundMoves = useFundMoves();
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);

  const rows = useMemo<FundRow[]>(() => {
    if (!user) return [];

    const today = startOfDay(new Date());
    const topLevel = funds.filter((fund) => fund.parentFund === null);

    const fundRows: FundRow[] = topLevel.map((fund) => ({
      id: fund.id,
      name: fund.name,
      color: fund.color,
      balance: getFundTreeBalanceAtDate(
        fund.id,
        funds,
        fundMoves,
        fundAllocations,
        user.startingDate,
        today,
      ),
      to: "/funds/$id",
      params: { id: fund.id },
    }));
    fundRows.sort((a, b) => b.balance - a.balance);

    const untracked = getUntrackedBalanceAtDate({
      accounts,
      activities,
      funds,
      fundAllocations,
      date: today,
      startingDate: user.startingDate,
    });
    if (Math.abs(untracked) >= 0.01) {
      fundRows.push({
        id: null,
        name: "Untracked",
        color: "var(--color-muted-foreground)",
        balance: untracked,
        to: "/funds/untracked",
        params: {},
      });
    }

    return fundRows;
  }, [funds, fundAllocations, fundMoves, accounts, activities, user]);

  const total = rows.reduce((sum, row) => sum + row.balance, 0);

  return (
    <section aria-label="Funds" className="flex min-w-0 flex-col">
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-9 shrink-0 items-center justify-between px-4 lg:px-6",
        )}
      >
        <span>Funds</span>
        <Link
          to="/funds"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground lg:px-6">
          No funds yet.
        </p>
      ) : (
        <div>
          {rows.map((row) => (
            <Link
              key={row.id ?? "untracked"}
              to={row.to}
              params={row.params}
              aria-label={`Open ${row.name}`}
              className={cn(
                ledgerRowClassName,
                "flex h-9 shrink-0 items-center gap-2 pr-2 pl-4 text-sm lg:px-6",
              )}
            >
              <span
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
              <span className="min-w-0 truncate">{row.name}</span>
              <span className="flex-1" />
              <span className="font-mono text-sm font-medium tabular-nums">
                {currencyFormatter.format(row.balance)}
              </span>
            </Link>
          ))}

          <div className="flex h-10 shrink-0 items-center gap-2 pr-2 pl-4 text-sm lg:px-6">
            <span className="font-medium">Total</span>
            <span className="flex-1" />
            <span className="font-mono text-sm font-semibold tabular-nums">
              {currencyFormatter.format(total)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
