import type {
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";

import { ActivityType } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import { AddActivityButton } from "@/components/activities/add-activity-button";
import { Button } from "@/components/ui/button";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

interface ProjectActivityCategoryLineProps {
  projectId: string;
  category: ActivityCategory;
  /** The type section the line sits in; totals are per type. */
  activityType: ActivityType;
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}

export function ProjectActivityCategoryLine({
  projectId,
  category,
  activityType,
  activitiesFilters,
  onActivitiesFiltersChange,
}: ProjectActivityCategoryLineProps) {
  const activities = useActivities((state) => state.activities);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const [expanded, setExpanded] = useState(false);
  const currencyFormatter = useCurrencyFormatter();

  const projectActivities = useMemo(
    () => activities.filter((a) => a.project === projectId),
    [activities, projectId],
  );

  const categoryTotal = useMemo(
    () =>
      projectActivities
        .filter(
          (a) => a.category === category.id && a.types.includes(activityType),
        )
        .reduce((total, a) => total + a.amounts[activityType], 0),
    [projectActivities, category.id, activityType],
  );

  const categorySubcategories = useMemo(
    () => subcategories.filter((sc) => sc.category === category.id),
    [subcategories, category.id],
  );

  const subcategoriesValues = useMemo(() => {
    const values: Record<string, number> = {};
    categorySubcategories.forEach((subcategory) => {
      values[subcategory.id] = 0;
    });

    projectActivities
      .filter(
        (a) =>
          a.category === category.id &&
          a.subcategory !== null &&
          a.types.includes(activityType),
      )
      .forEach((a) => {
        if (values[a.subcategory!] !== undefined) {
          values[a.subcategory!] += a.amounts[activityType];
        }
      });

    return values;
  }, [projectActivities, category.id, activityType, categorySubcategories]);

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
        <div className="group flex items-center text-xs font-medium">
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

          <div
            className="mr-2 hidden group-hover:block"
            onClick={(e) => e.stopPropagation()}
          >
            <AddActivityButton
              iconOnly
              size="sm"
              category={category.id}
              project={projectId}
            />
          </div>

          <div className="text-right font-mono text-sm font-medium whitespace-nowrap tabular-nums">
            {currencyFormatter.format(categoryTotal)}
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
