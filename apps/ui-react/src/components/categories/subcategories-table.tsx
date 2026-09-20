import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  ledgerAmountClassName,
  ledgerHeaderClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

import { Badge } from "../ui/badge";

export function SubcategoriesTable({ categoryId }: { categoryId: string }) {
  const activitySubcategories = useActivities(
    (state) => state.activitySubcategories,
  );
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = useCurrencyFormatter();

  const getNumberOfActivities = (subcategoryId: string) => {
    return activities.filter((a) => a.subcategory === subcategoryId).length;
  };

  const getTotalOfSubcategory = (subcategoryId: string) => {
    return activities
      .filter((a) => a.subcategory === subcategoryId)
      .reduce((acc, a) => {
        return acc + a.amount;
      }, 0);
  };

  const categorySubcategories = useMemo(() => {
    return [...activitySubcategories].filter(
      (subcategory) => subcategory.category === categoryId,
    );
  }, [activitySubcategories, categoryId]);

  const sortedSubcategories = useMemo(() => {
    return [...categorySubcategories].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [categorySubcategories]);

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-8 shrink-0 items-center gap-2 pr-4 pl-10 sm:pr-6 sm:pl-14",
        )}
      >
        <div>Subcategories</div>
        <div className="flex-1" />
        <div className="pl-4 text-right">
          {sortedSubcategories.length} subcategor
          {sortedSubcategories.length > 1 ? "ies" : "y"}
        </div>
      </div>

      {sortedSubcategories.map((subcategory) => (
        <Link
          key={subcategory.id}
          to={`/categories/$id/subcategories/$subcategoryId`}
          params={{ id: categoryId, subcategoryId: subcategory.id }}
          className={cn(
            ledgerRowClassName,
            "group flex h-11 w-full items-center border-b pr-4 pl-10 sm:h-10 sm:pr-6 sm:pl-14",
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

          <Badge className="ml-4" variant="outline">
            {getNumberOfActivities(subcategory.id)} activities
          </Badge>

          <div className="flex-1" />

          <div className={cn(ledgerAmountClassName, "w-32 text-sm")}>
            {currencyFormatter.format(getTotalOfSubcategory(subcategory.id))}
          </div>
        </Link>
      ))}
    </div>
  );
}
