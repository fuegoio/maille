import type {
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";

import { ActivityType } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import { Button } from "@/components/ui/button";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { getActivityCategoryTotalForMonth } from "@/logic/activities";
import { useActivities } from "@/stores/activities";

interface MonthActivityCategoryLineProps {
  monthDate: Date;
  category: ActivityCategory;
  /** The type section the line sits in; totals are per type. */
  activityType: ActivityType;
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}

export function MonthActivityCategoryLine({
  monthDate,
  category,
  activityType,
  activitiesFilters,
  onActivitiesFiltersChange,
}: MonthActivityCategoryLineProps) {
  const activities = useActivities((state) => state.activities);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const [expanded, setExpanded] = useState(false);
  const currencyFormatter = useCurrencyFormatter();

  const monthActivityCategoryValue = useMemo<number>(
    () =>
      getActivityCategoryTotalForMonth({
        monthDate,
        categoryId: category.id,
        activityType,
        activities,
      }),
    [monthDate, category.id, activityType, activities],
  );

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
          activity.subcategory !== null &&
          activity.types.includes(activityType),
      )
      .forEach((activity) => {
        if (values[activity.subcategory!] !== undefined) {
          values[activity.subcategory!] += activity.amounts[activityType];
        }
      });

    return values;
  }, [activities, monthDate, category.id, activityType, categorySubcategories]);

  // Filtering from a type's section applies the type along with the
  // category — a category can span several types, so the click targets
  // the pair.
  const isCategoryFiltered =
    activitiesFilters.category === category.id &&
    activitiesFilters.activityType === activityType;

  const selectCategoryToFilterActivities = () => {
    onActivitiesFiltersChange({
      activityType: isCategoryFiltered ? undefined : activityType,
      category: isCategoryFiltered ? undefined : category.id,
      subcategory: undefined,
    });
  };

  const selectSubcategoryToFilterActivities = (
    subcategory: ActivitySubCategory,
  ) => {
    const isSubcategoryFiltered =
      activitiesFilters.subcategory === subcategory.id &&
      activitiesFilters.activityType === activityType;

    onActivitiesFiltersChange({
      activityType: isSubcategoryFiltered ? undefined : activityType,
      category: undefined,
      subcategory: isSubcategoryFiltered ? undefined : subcategory.id,
    });
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors",
          {
            "bg-muted": isCategoryFiltered,
            "hover:bg-muted/50": !isCategoryFiltered,
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
              "hidden group-hover:block": !isCategoryFiltered,
            })}
          >
            {isCategoryFiltered ? "Clear filter" : "Filter"}
          </div>

          <div className="text-right font-mono text-sm font-medium whitespace-nowrap tabular-nums">
            {currencyFormatter.format(monthActivityCategoryValue)}
          </div>

          <Link
            to="/categories/$id"
            params={{ id: category.id }}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Open ${category.name}`}
            className="w-0 overflow-hidden text-muted-foreground opacity-0 transition-all duration-200 group-focus-within:w-6 group-focus-within:opacity-100 group-hover:w-6 group-hover:opacity-100"
          >
            <ChevronRight className="ml-2 size-4" />
          </Link>
        </div>
      </div>

      {expanded && (
        <div className="space-y-1 border-b pb-2">
          {categorySubcategories
            .filter((subcategory) => subcategoriesValues[subcategory.id] !== 0)
            .map((subcategory) => {
              const isSubcategoryFiltered =
                activitiesFilters.subcategory === subcategory.id &&
                activitiesFilters.activityType === activityType;

              return (
                <div
                  key={subcategory.id}
                  className={cn(
                    "group ml-4 flex h-7 cursor-pointer items-center justify-between rounded pr-3 pl-5 transition-colors",
                    {
                      "bg-muted": isSubcategoryFiltered,
                      "hover:bg-muted/50": !isSubcategoryFiltered,
                    },
                  )}
                  onClick={() =>
                    selectSubcategoryToFilterActivities(subcategory)
                  }
                >
                  <div className="flex items-center text-xs font-medium">
                    {subcategory.name}
                  </div>

                  <div className="flex items-center">
                    <div
                      className={cn("mr-4 text-sm text-muted-foreground", {
                        "hidden group-hover:block": !isSubcategoryFiltered,
                      })}
                    >
                      {isSubcategoryFiltered ? "Clear filter" : "Filter"}
                    </div>

                    <div className="text-right font-mono text-xs font-medium whitespace-nowrap tabular-nums">
                      {currencyFormatter.format(
                        subcategoriesValues[subcategory.id],
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
