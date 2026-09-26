import { ActivityType } from "@maille/core/activities";
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
  const activitySubcategories = useActivities(
    (state) => state.activitySubcategories,
  );
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = useCurrencyFormatter();

  const sortedCategories = useMemo(() => {
    return [...activityCategories].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [activityCategories]);

  const sortedSubcategories = useMemo(() => {
    return [...activitySubcategories].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [activitySubcategories]);

  const getNumberOfActivities = (categoryId: string) => {
    return activities.filter((a) => a.category === categoryId).length;
  };

  const getTotalOfCategory = (categoryId: string) => {
    return activities
      .filter((a) => a.category === categoryId)
      .reduce(
        (acc, a) =>
          acc +
          a.amounts[ActivityType.REVENUE] -
          a.amounts[ActivityType.EXPENSE],
        0,
      );
  };

  const getNumberOfSubcategoryActivities = (subcategoryId: string) => {
    return activities.filter((a) => a.subcategory === subcategoryId).length;
  };

  const getTotalOfSubcategory = (subcategoryId: string) => {
    return activities
      .filter((a) => a.subcategory === subcategoryId)
      .reduce(
        (acc, a) =>
          acc +
          a.amounts[ActivityType.REVENUE] -
          a.amounts[ActivityType.EXPENSE],
        0,
      );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {sortedCategories.map((category) => {
        const subcategories = sortedSubcategories.filter(
          (subcategory) => subcategory.category === category.id,
        );
        return (
          <div key={category.id} className="border-b">
            <Link
              to="/categories/$id"
              params={{ id: category.id }}
              className={cn(
                ledgerRowClassName,
                "group flex h-11 w-full items-center px-4 sm:h-10 sm:px-6",
              )}
            >
              <div className="flex items-center gap-2">
                {category.emoji && (
                  <span className="mr-2 text-sm">{category.emoji}</span>
                )}
                <div className="text-sm font-medium whitespace-nowrap">
                  {category.name}
                </div>
              </div>

              <div className="flex-1" />

              <div className="mr-4 text-sm text-muted-foreground">
                {getNumberOfActivities(category.id)} activities
              </div>

              <div className={cn(ledgerAmountClassName, "w-32 text-sm")}>
                {currencyFormatter.format(getTotalOfCategory(category.id))}
              </div>
            </Link>

            {subcategories.length > 0 && (
              <ul
                aria-label={`Subcategories of ${category.name}`}
                className="px-4 sm:px-6"
              >
                {subcategories.map((subcategory) => (
                  <li
                    key={subcategory.id}
                    className="relative flex h-9 items-center gap-2 pl-[1.375rem] before:absolute before:inset-y-0 before:left-0 before:border-l before:border-border/70 after:absolute after:top-[calc(50%-0.375rem)] after:left-0 after:w-3 after:origin-top-left after:rotate-30 after:border-t after:border-border/70 first:before:-top-2 last:before:bottom-[calc(50%+0.375rem)]"
                  >
                    <Link
                      to={`/categories/$id/subcategories/$subcategoryId`}
                      params={{
                        id: category.id,
                        subcategoryId: subcategory.id,
                      }}
                      className={cn(
                        ledgerRowClassName,
                        // No gap: the activities cell keeps its mr-4, so
                        // it stays under the header strip's Activities
                        "flex flex-1 items-center",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {subcategory.emoji && (
                          <span className="text-sm">{subcategory.emoji}</span>
                        )}
                        <div className="text-sm font-medium whitespace-nowrap">
                          {subcategory.name}
                        </div>
                      </div>

                      <div className="flex-1" />

                      <div className="mr-4 text-sm text-muted-foreground">
                        {getNumberOfSubcategoryActivities(subcategory.id)}{" "}
                        activities
                      </div>

                      <div
                        className={cn(ledgerAmountClassName, "w-32 text-sm")}
                      >
                        {currencyFormatter.format(
                          getTotalOfSubcategory(subcategory.id),
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
