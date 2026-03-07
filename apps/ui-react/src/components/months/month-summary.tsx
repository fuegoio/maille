import { AccountType } from "@maille/core/accounts";
import { ArrowRight, Minus, Plus } from "lucide-react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getAccountsBalance, getBalanceForMonth } from "@/logic/accounts";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

interface MonthSummaryProps {
  monthDate: Date;
}

export function MonthSummary({ monthDate }: MonthSummaryProps) {
  const currencyFormatter = useCurrencyFormatter();

  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const user = useAuth((state) => state.user!);

  const previousMonthDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1,
  );

  const revenue =
    getAccountsBalance({
      accountType: AccountType.REVENUE,
      monthDate,
      activities,
      accounts,
      startDate: user.startingDate,
    }) * -1;
  const expense = getAccountsBalance({
    accountType: AccountType.EXPENSE,
    monthDate,
    activities,
    accounts,
    startDate: user.startingDate,
  });

  return (
    <div className="w-full border-b p-6">
      <div className="flex items-center gap-3">
        <div className="font-semibold">Balance</div>
        <div className="flex-1" />
        <span className="font-mono text-muted-foreground">
          {currencyFormatter.format(
            getBalanceForMonth({
              monthDate: previousMonthDate,
              startingDate: user.startingDate,
              activities,
              accounts,
            }),
          )}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
        <span className="font-mono">
          {currencyFormatter.format(
            getBalanceForMonth({
              monthDate,
              startingDate: user.startingDate,
              activities,
              accounts,
            }),
          )}
        </span>
      </div>

      <div className="mt-3 flex items-center text-sm">
        <div className="font-medium">Earnings</div>
        <div className="flex-1" />
        <span className="flex items-center gap-1 font-mono font-medium">
          {revenue > expense ? (
            <Plus className="size-3 text-emerald-400" />
          ) : (
            <Minus className="size-3 text-red-400" />
          )}
          {currencyFormatter.format(Math.abs(revenue - expense))}
        </span>
      </div>
    </div>
  );
}
