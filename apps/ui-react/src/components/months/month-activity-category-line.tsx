import type {
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { cn, getCurrencyFormatter } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

interface MonthActivityCategoryLineProps {
  monthDate: Date;
  category: ActivityCategory;
}

export function MonthActivityCategoryLine({
  monthDate,
  category,
}: MonthActivityCategoryLineProps) {
  const activities = useActivities((state) => state.activities);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const [expanded, setExpanded] = useState(false);

  const viewFilters = {
    activityType: null,
    category: null,
    subcategory: null,
  };

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
    viewFilters.subcategory = null;
    viewFilters.activityType = null;
    if (viewFilters.category !== category.id) {
      viewFilters.category = category.id;
    } else {
      viewFilters.category = null;
    }
  };

  const selectSubcategoryToFilterActivities = (
    subcategory: ActivitySubCategory,
  ) => {
    viewFilters.category = null;
    viewFilters.activityType = null;
    if (viewFilters.subcategory !== subcategory.id) {
      viewFilters.subcategory = subcategory.id;
    } else {
      viewFilters.subcategory = null;
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors",
          {
            "bg-muted": viewFilters.category === category.id,
            "hover:bg-muted/50": viewFilters.category !== category.id,
          },
        )}
        onClick={selectCategoryToFilterActivities}
      >
        <div
          className={cn("flex items-center text-xs font-medium", {
            "pl-6": categorySubcategories.length === 0,
          })}
        >
          {categorySubcategories.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 h-4 w-4"
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
          {category.name}
        </div>

        <div className="flex items-center">
          <div
            className={cn("mr-4 text-sm text-muted-foreground", {
              "hidden group-hover:block": viewFilters.category !== category.id,
            })}
          >
            {viewFilters.category === category.id ? "Clear filter" : "Filter"}
          </div>

          <div className="font-mono text-sm whitespace-nowrap text-white">
            {getCurrencyFormatter().format(monthActivityCategoryValue)}
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
                  "bg-muted": viewFilters.subcategory === subcategory.id,
                  "hover:bg-muted/50":
                    viewFilters.subcategory !== subcategory.id,
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
                      viewFilters.subcategory !== subcategory.id,
                  })}
                >
                  {viewFilters.subcategory === subcategory.id
                    ? "Clear filter"
                    : "Filter"}
                </div>

                <div className="font-mono text-xs whitespace-nowrap">
                  {getCurrencyFormatter().format(
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
