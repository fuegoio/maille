import type {
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import type { ActivitiesFilters } from "@/types/activities";

interface MonthActivityCategoryLineProps {
  monthDate: Date;
  category: ActivityCategory;
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}

export function MonthActivityCategoryLine({
  monthDate,
  category,
  activitiesFilters,
  onActivitiesFiltersChange,
}: MonthActivityCategoryLineProps) {
  const activities = useActivities((state) => state.activities);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const [expanded, setExpanded] = useState(false);
  const currencyFormatter = useCurrencyFormatter();

  const monthActivityCategoryValue = useMemo<number>(() => {
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
      .filter((a) => a.category === category.id)
      .filter((a) => a.date >= startOfMonth && a.date <= endOfMonth)
      .reduce((total, a) => total + a.amount, 0);
  }, [monthDate, category.id, activities]);

  const categorySubcategories = useMemo(() => {
    return subcategories.filter((sc) => sc.category === category.id);
  }, [subcategories, category.id]);

  const subcategoriesValues = useMemo(() => {
    const values: Record<string, number> = {};
    categorySubcategories.forEach((subcategory) => {
      values[subcategory.id] = 0;
    });

    activities
      .filter(
        (activity) =>
          activity.date.getMonth() === monthDate.getMonth() &&
          activity.date.getFullYear() === monthDate.getFullYear() &&
          activity.category === category.id &&
          activity.subcategory !== null,
      )
      .forEach((activity) => {
        if (values[activity.subcategory!] !== undefined) {
          values[activity.subcategory!] += activity.amount;
        }
      });

    return values;
  }, [activities, monthDate, category.id, categorySubcategories]);

  const selectCategoryToFilterActivities = () => {
    onActivitiesFiltersChange({
      activityType: undefined,
      category:
        activitiesFilters.category !== category.id ? category.id : undefined,
      subcategory: undefined,
    });
  };

  const selectSubcategoryToFilterActivities = (
    subcategory: ActivitySubCategory,
  ) => {
    onActivitiesFiltersChange({
      activityType: undefined,
      category: undefined,
      subcategory:
        activitiesFilters.subcategory !== subcategory.id
          ? subcategory.id
          : undefined,
    });
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors",
          {
            "bg-muted": activitiesFilters.category === category.id,
            "hover:bg-muted/50": activitiesFilters.category !== category.id,
          },
        )}
        onClick={selectCategoryToFilterActivities}
      >
        <div className={cn("group flex items-center text-xs font-medium")}>
          {categorySubcategories.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 hidden h-4 w-4 group-hover:flex"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <span
            className={cn(
              "mr-2",
              categorySubcategories.length > 0 ? "group-hover:hidden" : "",
            )}
          >
            {category.emoji}
          </span>
          {category.name}
        </div>

        <div className="flex items-center">
          <div
            className={cn("mr-4 text-sm text-muted-foreground", {
              "hidden group-hover:block":
                activitiesFilters.category !== category.id,
            })}
          >
            {activitiesFilters.category === category.id
              ? "Clear filter"
              : "Filter"}
          </div>

          <div className="font-mono text-sm whitespace-nowrap text-white">
            {currencyFormatter.format(monthActivityCategoryValue)}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-1 border-b pb-2">
          {categorySubcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className={cn(
                "group ml-4 flex h-7 cursor-pointer items-center justify-between rounded pr-3 pl-5 transition-colors",
                {
                  "bg-muted": activitiesFilters.subcategory === subcategory.id,
                  "hover:bg-muted/50":
                    activitiesFilters.subcategory !== subcategory.id,
                },
              )}
              onClick={() => selectSubcategoryToFilterActivities(subcategory)}
            >
              <div className="flex items-center text-xs font-medium">
                {subcategory.name}
              </div>

              <div className="flex items-center">
                <div
                  className={cn("mr-4 text-sm text-muted-foreground", {
                    "hidden group-hover:block":
                      activitiesFilters.subcategory !== subcategory.id,
                  })}
                >
                  {activitiesFilters.subcategory === subcategory.id
                    ? "Clear filter"
                    : "Filter"}
                </div>

                <div className="font-mono text-xs whitespace-nowrap">
                  {currencyFormatter.format(
                    subcategoriesValues[subcategory.id],
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
