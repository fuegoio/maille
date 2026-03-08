import { ActivityType } from "@maille/core/activities";
import Color from "colorjs.io";
import { useMemo } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";

import { ProjectActivityCategoryLine } from "./project-activity-category-line";

interface ProjectActivitiesSummaryProps {
  projectId: string;
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}

export function ProjectActivitiesSummary({
  projectId,
  activitiesFilters,
  onActivitiesFiltersChange,
}: ProjectActivitiesSummaryProps) {
  const categories = useActivities((state) => state.activityCategories);
  const activities = useActivities((state) => state.activities);

  const projectActivities = useMemo(
    () => activities.filter((a) => a.project === projectId),
    [activities, projectId],
  );

  const getCategories = (activityType: ActivityType) =>
    categories
      .filter((c) => c.type === activityType)
      .filter((c) => projectActivities.some((a) => a.category === c.id))
      .sort((a, b) => a.name.localeCompare(b.name));

  const getTypeTotal = (activityType: ActivityType) =>
    projectActivities
      .filter((a) => a.type === activityType)
      .reduce((total, a) => total + a.amount, 0);

  const getCategoryTotal = (categoryId: string) =>
    projectActivities
      .filter((a) => a.category === categoryId)
      .reduce((total, a) => total + a.amount, 0);

  const getProgressBarColor = (index: number, activityType: ActivityType) => {
    const color = new Color(
      {
        [ActivityType.REVENUE]: "#4ade80",
        [ActivityType.EXPENSE]: "#f87171",
        [ActivityType.INVESTMENT]: "#fb923c",
        [ActivityType.NEUTRAL]: "#9ca3af",
      }[activityType],
    );
    color.lch.l =
      80 +
      (index / categories.filter((c) => c.type === activityType).length) * -50;
    return color;
  };

  const currencyFormatter = useCurrencyFormatter();

  const activityTypes = [
    ActivityType.REVENUE,
    ActivityType.EXPENSE,
    ActivityType.INVESTMENT,
    ActivityType.NEUTRAL,
  ].map((type) => ({ type, value: getTypeTotal(type) }));

  return (
    <div>
      {activityTypes.map((activityType) => (
        <div key={activityType.type} className="w-full border-b px-3 py-4">
          <div
            className={cn(
              "group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors",
              {
                "bg-muted":
                  activitiesFilters.activityType === activityType.type,
                "hover:bg-muted/50":
                  activitiesFilters.activityType !== activityType.type,
              },
            )}
            onClick={() => {
              onActivitiesFiltersChange({
                ...activitiesFilters,
                activityType:
                  activitiesFilters.activityType === activityType.type
                    ? undefined
                    : activityType.type,
              });
            }}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "mr-2 size-3 shrink-0 rounded-full",
                  ACTIVITY_TYPES_COLOR[activityType.type],
                )}
              />
              <span className="text-sm font-medium text-white">
                {ACTIVITY_TYPES_NAME[activityType.type]}
              </span>
            </div>

            <div className="flex items-center">
              <div
                className={`text-primary-200 mr-4 text-sm ${
                  activitiesFilters.activityType === activityType.type
                    ? ""
                    : "hidden group-hover:block"
                }`}
              >
                {activitiesFilters.activityType === activityType.type
                  ? "Clear filter"
                  : "Filter"}
              </div>
              <div className="text-right font-mono text-sm font-medium whitespace-nowrap text-white">
                {currencyFormatter.format(activityType.value)}
              </div>
            </div>
          </div>

          {activityType.value !== 0 && (
            <div className="mt-1 mb-2 px-2">
              <div className="flex h-2 w-full items-center overflow-hidden rounded-md bg-muted transition-all hover:h-4">
                {getCategories(activityType.type).map((category, index) => {
                  const categoryValue = getCategoryTotal(category.id);
                  const percentage = (categoryValue / activityType.value) * 100;
                  const color = getProgressBarColor(index, activityType.type);

                  return (
                    <Tooltip key={category.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-full transition-all hover:opacity-50"
                          style={{
                            background: color.toString(),
                            width: `${percentage}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {category.name} ({Math.round(percentage * 100) / 100}%)
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {getCategories(activityType.type).map((category) => (
            <ProjectActivityCategoryLine
              key={category.id}
              projectId={projectId}
              category={category}
              activitiesFilters={activitiesFilters}
              onActivitiesFiltersChange={onActivitiesFiltersChange}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
