import { ArrowRight } from "lucide-react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
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

  const getAccountBalanceAtDate = (date: Date): number => {
    // Get all transactions for this account up to the given date
    const transactions = activities
      .filter((a) => new Date(a.date) <= date)
      .flatMap((a) => a.transactions)
      .filter((t) => t.fromAccount === accountId || t.toAccount === accountId);

    // Calculate balance from transactions
    const transactionsBalance = transactions.reduce((acc, t) => {
      if (t.fromAccount === accountId) {
        return acc - t.amount;
      } else {
        return acc + t.amount;
      }
    }, 0);

    return (account.startingBalance ?? 0) + transactionsBalance;
  };

  const getAccountCashBalanceAtDate = (date: Date): number => {
    // Get all movements for this account up to the given date
    const accountMovements = movements.filter(
      (m) => m.account === accountId && new Date(m.date) <= date,
    );

    // Calculate cash balance from movements
    return accountMovements.reduce((acc, m) => acc + m.amount, 0);
  };

  const startBalance = getAccountBalanceAtDate(
    new Date(startOfMonth.getTime() - 1),
  );
  const endBalance = getAccountBalanceAtDate(endOfMonth);

  const startCashBalance = getAccountCashBalanceAtDate(
    new Date(startOfMonth.getTime() - 1),
  );
  const endCashBalance = getAccountCashBalanceAtDate(endOfMonth);

  return (
    <div className="ml-4 rounded py-2 pr-3 pl-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center font-medium">{account.name}</div>

        <div className="flex items-center gap-2">
          <div className="font-mono whitespace-nowrap text-muted-foreground">
            {currencyFormatter.format(startBalance)}
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
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
            {startCashBalance !== endCashBalance && (
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
