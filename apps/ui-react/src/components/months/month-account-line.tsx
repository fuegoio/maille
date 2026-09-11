import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { getAccountBalanceAtDate } from "@/logic/accounts";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useMovements } from "@/stores/movements";

interface MonthAccountLineProps {
  monthDate: Date;
  accountId: string;
  /** The account currently filtering the month's tables. */
  accountFilter?: string;
  /** Set the account filtering the tables; undefined clears. */
  onAccountFilterChange?: (account: string | undefined) => void;
}

export function MonthAccountLine({
  monthDate,
  accountId,
  accountFilter,
  onAccountFilterChange,
}: MonthAccountLineProps) {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const movements = useMovements((state) => state.movements);
  const currencyFormatter = useCurrencyFormatter();
  const user = useAuth((state) => state.user!);

  const account = accounts.find((a) => a.id === accountId);
  if (!account) return null;

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

  const getBalanceAtDate = (date: Date): number =>
    getAccountBalanceAtDate({
      accountId,
      date,
      activities,
      accounts,
      startingDate: user.startingDate,
    });

  const getAccountCashBalanceAtDate = (date: Date): number => {
    // Get all movements for this account up to the given date
    const accountMovements = movements.filter(
      (m) =>
        m.account === accountId &&
        new Date(m.date) <= date &&
        m.date >= user.startingDate,
    );

    // Calculate cash balance from movements
    return accountMovements.reduce(
      (acc, m) => acc + m.amount,
      account.startingCashBalance ?? 0,
    );
  };

  const startBalance = getBalanceAtDate(new Date(startOfMonth.getTime() - 1));
  const endBalance = getBalanceAtDate(endOfMonth);

  const startCashBalance = getAccountCashBalanceAtDate(
    new Date(startOfMonth.getTime() - 1),
  );
  const endCashBalance = getAccountCashBalanceAtDate(endOfMonth);

  const active = accountFilter === account.id;
  const selectAccount = () =>
    onAccountFilterChange?.(active ? undefined : account.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={selectAccount}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectAccount();
        }
      }}
      className={cn(
        "group ml-4 cursor-pointer rounded pr-3 pl-4 transition-colors",
        active ? "bg-muted" : "hover:bg-muted/50",
      )}
    >
      <div className="flex h-9 items-center justify-between">
        <div className="min-w-0 truncate text-sm font-medium">
          {account.name}
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

          <div className="flex items-center gap-2">
            {Math.abs(startBalance - endBalance) >= 0.01 && (
              <>
                <div className="font-mono text-sm whitespace-nowrap text-muted-foreground">
                  {currencyFormatter.format(startBalance)}
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </>
            )}
            <div className="font-mono text-sm whitespace-nowrap">
              {currencyFormatter.format(endBalance)}
            </div>
          </div>

          <Link
            to="/accounts/$id"
            params={{ id: account.id }}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Open ${account.name}`}
            className="w-0 overflow-hidden text-muted-foreground opacity-0 transition-all duration-200 group-focus-within:w-6 group-focus-within:opacity-100 group-hover:w-6 group-hover:opacity-100"
          >
            <ChevronRight className="ml-2 size-4" />
          </Link>
        </div>
      </div>

      {account.movements && (
        <div className="flex h-7 items-center pl-4 text-xs text-muted-foreground">
          <div className="font-medium">Cash balance</div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {Math.abs(startCashBalance - endCashBalance) >= 0.01 && (
              <>
                <span className="font-mono">
                  {currencyFormatter.format(startCashBalance)}
                </span>
                <ArrowRight className="size-3" />
              </>
            )}
            <span className="font-mono">
              {currencyFormatter.format(endCashBalance)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
