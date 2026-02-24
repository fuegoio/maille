import { ActivityType } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, CalendarClock } from "lucide-react";
import { useMemo } from "react";

import { cn, getCurrencyFormatter } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import { useActivities, ACTIVITY_TYPES_COLOR } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

export function MonthsTable() {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);
  const currencyFormatter = getCurrencyFormatter();

  const today = new Date();

  // Generate months from user start date to 12 months in the future
  const months = useMemo(() => {
    if (!user?.startingDate) return [];

    const months = [];
    const startDate = new Date(user.startingDate);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 12); // 12 months in the future

    // Start from the beginning of the user start month
    let currentMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );

    // Go month by month until we reach the end date
    while (currentMonth <= endDate) {
      months.push(new Date(currentMonth));
      currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      );
    }

    return months;
  }, [user?.startingDate]);

  const getActivityTypeTotalForMonth = (
    monthDate: Date,
    activityType: ActivityType,
  ) => {
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

    return activities
      .filter((a) => a.type === activityType)
      .filter((a) => a.date >= startOfMonth && a.date <= endOfMonth)
      .reduce((total, a) => total + a.amount, 0);
  };

  const getBalanceForMonth = (monthDate: Date): number => {
    // Calculate the balance for the previous month
    const previousMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() - 1,
      1,
    );
    const previousBalance =
      previousMonth >= new Date(user!.startingDate)
        ? getBalanceForMonth(previousMonth)
        : accounts.reduce(
            (total, account) => total + (account.startingBalance ?? 0),
            0,
          );

    // Calculate revenue and expense for the current month
    const revenue = getActivityTypeTotalForMonth(
      monthDate,
      ActivityType.REVENUE,
    );
    const expense = getActivityTypeTotalForMonth(
      monthDate,
      ActivityType.EXPENSE,
    );

    // Compute the balance for the current month
    return previousBalance + revenue - expense;
  };

  const periodFormatter = (date: Date): string => {
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="h-full w-full">
      {months.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          {months.map((monthDate) => {
            const balance = getBalanceForMonth(monthDate);
            const revenue = getActivityTypeTotalForMonth(
              monthDate,
              ActivityType.REVENUE,
            );
            const expense = getActivityTypeTotalForMonth(
              monthDate,
              ActivityType.EXPENSE,
            );
            const investment = getActivityTypeTotalForMonth(
              monthDate,
              ActivityType.INVESTMENT,
            );
            const neutral = getActivityTypeTotalForMonth(
              monthDate,
              ActivityType.NEUTRAL,
            );

            return (
              <Link
                key={`${monthDate.getMonth()}-${monthDate.getFullYear()}`}
                to="/months/$month"
                params={{
                  month: format(monthDate, "MM-yyyy"),
                }}
                className={cn(
                  "flex h-12 shrink-0 items-center gap-2 border-b pr-6 hover:bg-muted/50",
                  monthDate.getMonth() === today.getMonth() &&
                    monthDate.getFullYear() === today.getFullYear()
                    ? "border-l-4 border-l-primary pl-5"
                    : "pl-6",
                )}
              >
                {monthDate > today && (
                  <CalendarClock className="size-4 text-muted-foreground" />
                )}
                {monthDate.getMonth() === today.getMonth() &&
                  monthDate.getFullYear() === today.getFullYear() && (
                    <Calendar className="size-4" />
                  )}

                <div
                  className={cn(
                    "text-sm font-medium",
                    monthDate > today && "text-muted-foreground",
                  )}
                >
                  {periodFormatter(monthDate)}
                </div>
                <div className="flex-1" />

                {/* Balance */}
                <div className="mr-4 flex w-32 items-center pl-4 text-right font-mono text-sm">
                  <div className="mr-3 size-2.5 shrink-0 rounded-lg bg-indigo-400" />
                  <div className="flex-1">
                    {currencyFormatter.format(balance)}
                  </div>
                </div>

                {/* Revenue */}
                <div className="mr-4 flex w-32 items-center pl-4 text-right font-mono text-sm">
                  <div
                    className={cn(
                      "mr-3 size-2.5 shrink-0 rounded-lg",
                      ACTIVITY_TYPES_COLOR[ActivityType.REVENUE],
                    )}
                  />
                  <div className="flex-1">
                    {currencyFormatter.format(revenue)}
                  </div>
                </div>

                {/* Investment */}
                <div className="mr-4 flex w-32 items-center pl-4 text-right font-mono text-sm">
                  <div
                    className={cn(
                      "mr-3 size-2.5 shrink-0 rounded-lg",
                      ACTIVITY_TYPES_COLOR[ActivityType.INVESTMENT],
                    )}
                  />
                  <div className="flex-1">
                    {currencyFormatter.format(investment)}
                  </div>
                </div>

                {/* Expense */}
                <div className="mr-4 flex w-32 items-center pl-4 text-right font-mono text-sm">
                  <div
                    className={cn(
                      "mr-3 size-2.5 shrink-0 rounded-lg",
                      ACTIVITY_TYPES_COLOR[ActivityType.EXPENSE],
                    )}
                  />
                  <div className="flex-1">
                    {currencyFormatter.format(expense)}
                  </div>
                </div>

                {/* Neutral */}
                <div className="flex w-32 items-center pl-4 text-right font-mono text-sm">
                  <div
                    className={cn(
                      "mr-3 size-2.5 shrink-0 rounded-lg",
                      ACTIVITY_TYPES_COLOR[ActivityType.NEUTRAL],
                    )}
                  />
                  <div className="flex-1">
                    {currencyFormatter.format(neutral)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center overflow-hidden">
          <div className="text-sm text-muted-foreground">
            No user data available.
          </div>
        </div>
      )}
    </div>
  );
}
