import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
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
      <div className="flex h-8 shrink-0 items-center gap-2 border-b bg-muted/70 pr-6 pl-14">
        <div className="text-sm font-medium">Subcategories</div>
        <div className="flex-1" />
        <div className="pl-4 text-right text-sm text-muted-foreground">
          {sortedSubcategories.length} subcategor
          {sortedSubcategories.length > 1 ? "ies" : "y"}
        </div>
      </div>

      {sortedSubcategories.map((subcategory) => (
        <Link
          key={subcategory.id}
          to={`/categories/$id/subcategories/$subcategoryId`}
          params={{ id: categoryId, subcategoryId: subcategory.id }}
          className="group flex h-10 w-full items-center border-b pr-6 pl-14 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            {subcategory.emoji && (
              <span className="text-sm">{subcategory.emoji}</span>
            )}
            <div className="text-sm font-medium">{subcategory.name}</div>
          </div>

          <Badge className="ml-4" variant="outline">
            {getNumberOfActivities(subcategory.id)} activities
          </Badge>

          <div className="flex-1" />

          <div className="font-mono text-sm">
            {currencyFormatter.format(getTotalOfSubcategory(subcategory.id))}
          </div>
        </Link>
      ))}
    </div>
  );
}
