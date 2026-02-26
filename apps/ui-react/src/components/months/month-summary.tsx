import { ActivityType } from "@maille/core/activities";
import { ArrowRight, Minus, Plus } from "lucide-react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
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
  const user = useAuth((state) => state.user);

  const previousMonthDate = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1,
  );

  const getActivityTypeTotalForMonth = (
    date: Date,
    activityType: ActivityType,
  ) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return activities
      .filter((a) => a.type === activityType)
      .filter((a) => a.date >= startOfMonth && a.date <= endOfMonth)
      .reduce((total, a) => total + a.amount, 0);
  };

  const getBalanceForMonth = (date: Date): number => {
    // Calculate the balance for the previous month
    const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const previousBalance =
      previousMonth >= new Date(user!.startingDate)
        ? getBalanceForMonth(previousMonth)
        : accounts.reduce(
            (total, account) => total + (account.startingBalance ?? 0),
            0,
          );

    // Calculate revenue and expense for the current month
    const revenue = getActivityTypeTotalForMonth(date, ActivityType.REVENUE);
    const expense = getActivityTypeTotalForMonth(date, ActivityType.EXPENSE);

    // Compute the balance for the current month
    return previousBalance + revenue - expense;
  };

  return (
    <div className="w-full border-b p-6">
      <div className="flex items-center gap-3">
        <div className="font-semibold">Balance</div>
        <div className="flex-1" />
        <span className="font-mono text-muted-foreground">
          {currencyFormatter.format(getBalanceForMonth(previousMonthDate))}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
        <span className="font-mono">
          {currencyFormatter.format(getBalanceForMonth(monthDate))}
        </span>
      </div>

      <div className="mt-3 flex items-center text-sm">
        <div className="font-medium">Earnings</div>
        <div className="flex-1" />
        <span className="flex items-center gap-1 font-mono font-medium">
          {getActivityTypeTotalForMonth(monthDate, ActivityType.REVENUE) >
          getActivityTypeTotalForMonth(monthDate, ActivityType.EXPENSE) ? (
            <Plus className="size-3 text-emerald-400" />
          ) : (
            <Minus className="size-3 text-red-400" />
          )}
          {currencyFormatter.format(
            Math.abs(
              getActivityTypeTotalForMonth(monthDate, ActivityType.REVENUE) -
                getActivityTypeTotalForMonth(monthDate, ActivityType.EXPENSE),
            ),
          )}
        </span>
      </div>
    </div>
  );
}
