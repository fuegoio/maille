import type {
  ActivityAmounts,
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";

import { sumActivityAmounts } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivityAmountsValue } from "@/components/activities/activity-amounts";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { Button } from "@/components/ui/button";
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

  const projectCategoryActivities = useMemo(
    () =>
      activities.filter(
        (a) => a.project === projectId && a.category === category.id,
      ),
    [activities, projectId, category.id],
  );

  // The category's amounts per type in the project — types are derived from
  // the accounts, so one category can carry several.
  const categoryAmounts = useMemo(
    () => sumActivityAmounts(projectCategoryActivities),
    [projectCategoryActivities],
  );

  const categorySubcategories = useMemo(
    () => subcategories.filter((sc) => sc.category === category.id),
    [subcategories, category.id],
  );

  const subcategoriesAmounts = useMemo(() => {
    const values: Record<string, ActivityAmounts> = {};
    for (const subcategory of categorySubcategories) {
      values[subcategory.id] = sumActivityAmounts(
        projectCategoryActivities.filter(
          (a) => a.subcategory === subcategory.id,
        ),
      );
    }
    return values;
  }, [projectCategoryActivities, categorySubcategories]);

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

          <ActivityAmountsValue amounts={categoryAmounts} className="text-sm" />

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
            .filter((subcategory) =>
              Object.values(subcategoriesAmounts[subcategory.id]).some(
                (amount) => amount !== 0,
              ),
            )
            .map((subcategory) => (
              <div
                key={subcategory.id}
                className={cn(
                  "group ml-4 flex h-7 cursor-pointer items-center justify-between rounded pr-3 pl-5 transition-colors",
                  {
                    "bg-muted":
                      activitiesFilters.subcategory === subcategory.id,
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

                  <ActivityAmountsValue
                    amounts={subcategoriesAmounts[subcategory.id]}
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
