import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  ledgerAmountClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

export function CategoriesTable() {
  const activityCategories = useActivities((state) => state.activityCategories);
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = useCurrencyFormatter();

  const sortedCategories = useMemo(() => {
    return [...activityCategories].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [activityCategories]);

  const getNumberOfActivities = (categoryId: string) => {
    return activities.filter((a) => a.category === categoryId).length;
  };

  const getTotalOfCategory = (categoryId: string) => {
    return activities
      .filter((a) => a.category === categoryId)
      .reduce((acc, a) => {
        return acc + a.amount;
      }, 0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {sortedCategories.map((category) => (
        <Link
          key={category.id}
          to="/categories/$id"
          params={{ id: category.id }}
          className={cn(
            ledgerRowClassName,
            "group flex h-11 w-full items-center border-b px-4 sm:h-10 sm:px-6",
          )}
        >
          <div className="flex items-center gap-2">
            {category.emoji && (
              <span className="mr-2 text-sm">{category.emoji}</span>
            )}
            <div className="text-sm font-medium">{category.name}</div>
          </div>

          <div className="flex-1" />

          <div className="mr-4 text-sm text-muted-foreground">
            {getNumberOfActivities(category.id)} activities
          </div>

          <div className={cn(ledgerAmountClassName, "w-32 text-sm")}>
            {currencyFormatter.format(getTotalOfCategory(category.id))}
          </div>
        </Link>
      ))}
    </div>
  );
}
