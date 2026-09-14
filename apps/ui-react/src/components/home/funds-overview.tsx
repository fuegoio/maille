import { flattenFundTree } from "@maille/core/funds";
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
  depth: number;
  balance: number;
  to: string;
  params: Record<string, string>;
}

/**
 * Where the money is held by purpose: the whole fund tree, each fund
 * indented under its parent with its subtree rollup (the same figures
 * as the funds page), with Untracked closing the list as the money no
 * fund claims.
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
    const nodes = flattenFundTree(funds);

    const fundRows: FundRow[] = nodes.map(({ fund, depth }) => ({
      id: fund.id,
      name: fund.name,
      color: fund.color,
      depth,
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
        depth: 0,
        balance: untracked,
        to: "/funds/untracked",
        params: {},
      });
    }

    return fundRows;
  }, [funds, fundAllocations, fundMoves, accounts, activities, user]);

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
        <div className="py-4">
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
                className="flex min-w-0 items-center gap-2"
                style={
                  row.depth > 0
                    ? { paddingLeft: `${row.depth * 16}px` }
                    : undefined
                }
              >
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{row.name}</span>
              </span>
              <span className="flex-1" />
              <span className="font-mono text-sm font-medium tabular-nums">
                {currencyFormatter.format(row.balance)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
