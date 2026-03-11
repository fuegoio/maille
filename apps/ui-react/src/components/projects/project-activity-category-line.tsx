import type {
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";

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
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}

export function ProjectActivityCategoryLine({
  projectId,
  category,
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
        .filter((a) => a.category === category.id)
        .reduce((total, a) => total + a.amount, 0),
    [projectActivities, category.id],
  );

  const categorySubcategories = useMemo(
    () => subcategories.filter((sc) => sc.category === category.id),
    [subcategories, category.id],
  );

  const subcategoriesValues = useMemo(() => {
    const values: Record<string, number> = {};
    categorySubcategories.forEach((sc) => {
      values[sc.id] = 0;
    });
    projectActivities
      .filter((a) => a.category === category.id && a.subcategory !== null)
      .forEach((a) => {
        if (values[a.subcategory!] !== undefined) {
          values[a.subcategory!] += a.amount;
        }
      });
    return values;
  }, [projectActivities, category.id, categorySubcategories]);

  const selectCategory = () => {
    onActivitiesFiltersChange({
      activityType: undefined,
      category:
        activitiesFilters.category !== category.id ? category.id : undefined,
      subcategory: undefined,
    });
  };

  const selectSubcategory = (subcategory: ActivitySubCategory) => {
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
        onClick={selectCategory}
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
              "hidden group-hover:block":
                activitiesFilters.category !== category.id,
            })}
          >
            {activitiesFilters.category === category.id
              ? "Clear filter"
              : "Filter"}
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
              type={category.type}
            />
          </div>

          <div className="font-mono text-sm whitespace-nowrap text-white">
            {currencyFormatter.format(categoryTotal)}
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
              onClick={() => selectSubcategory(subcategory)}
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
