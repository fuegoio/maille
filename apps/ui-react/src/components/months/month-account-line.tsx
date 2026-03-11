import { ArrowRight } from "lucide-react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getAccountBalanceAtDate } from "@/logic/accounts";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useMovements } from "@/stores/movements";

interface MonthAccountLineProps {
  monthDate: Date;
  accountId: string;
}

export function MonthAccountLine({
  monthDate,
  accountId,
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

  return (
    <div className="ml-4 rounded py-2 pr-3 pl-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center font-medium">{account.name}</div>

        <div className="flex items-center gap-2">
          {Math.abs(startBalance - endBalance) >= 0.01 && (
            <>
              <div className="font-mono whitespace-nowrap text-muted-foreground">
                {currencyFormatter.format(startBalance)}
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </>
          )}
          <div className="font-mono whitespace-nowrap">
            {currencyFormatter.format(endBalance)}
          </div>
        </div>
      </div>

      {account.movements && (
        <div className="mt-1 flex items-center pl-4 text-xs text-muted-foreground">
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
