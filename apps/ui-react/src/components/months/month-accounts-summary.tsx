import { AccountType } from "@maille/core/accounts";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import {
  useAccounts,
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
} from "@/stores/accounts";
import { useActivities } from "@/stores/activities";

import { MonthAccountLine } from "./month-account-line";

interface MonthAccountsSummaryProps {
  monthDate: Date;
}

export function MonthAccountsSummary({ monthDate }: MonthAccountsSummaryProps) {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);

  const currencyFormatter = useCurrencyFormatter();

  const getAccountBalanceAtDate = (accountId: string, date: Date): number => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return 0;

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

  const getAccountTypeVariation = (
    accountType: AccountType,
  ): { start: number; end: number } => {
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

    const accountsOfType = accounts.filter((a) => a.type === accountType);

    const startBalance = accountsOfType.reduce((total, account) => {
      return (
        total +
        getAccountBalanceAtDate(
          account.id,
          new Date(startOfMonth.getTime() - 1),
        )
      );
    }, 0);

    const endBalance = accountsOfType.reduce((total, account) => {
      return total + getAccountBalanceAtDate(account.id, endOfMonth);
    }, 0);

    return { start: startBalance, end: endBalance };
  };

  const accountTypes = useMemo(
    () => [
      AccountType.BANK_ACCOUNT,
      AccountType.INVESTMENT_ACCOUNT,
      AccountType.CASH,
      AccountType.LIABILITIES,
      AccountType.ASSETS,
      AccountType.EXPENSE,
      AccountType.REVENUE,
    ],
    [],
  );

  return (
    <div>
      {accountTypes.map((accountType) => {
        const variation = getAccountTypeVariation(accountType);
        const accountsOfType = accounts.filter((a) => a.type === accountType);

        return (
          <div key={accountType} className="w-full border-b px-3 py-4">
            <div className="flex h-9 items-center justify-between rounded px-3">
              <div className="flex items-center">
                <div
                  className={cn(
                    `mr-2 size-3 shrink-0 rounded-full`,
                    ACCOUNT_TYPES_COLOR[accountType],
                  )}
                />
                <span className="text-sm font-medium">
                  {ACCOUNT_TYPES_NAME[accountType]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {variation.start !== variation.end && (
                  <>
                    <span className="font-mono text-muted-foreground">
                      {currencyFormatter.format(variation.start)}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </>
                )}
                <div className="font-mono text-sm whitespace-nowrap">
                  {currencyFormatter.format(variation.end)}
                </div>
              </div>
            </div>

            {accountsOfType.length > 0 && (
              <div className="mt-2 space-y-1 pb-2">
                {accountsOfType.map((account) => (
                  <MonthAccountLine
                    key={account.id}
                    monthDate={monthDate}
                    accountId={account.id}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
