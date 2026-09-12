import { ActivityType } from "@maille/core/activities";
import Color from "colorjs.io";

import type { ActivitiesFilters } from "@/types/activities";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import {
  getActivityCategoryTotalForMonth,
  getActivityTypeTotalForMonth,
} from "@/logic/activities";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";

import { MonthActivityCategoryLine } from "./month-activity-category-line";

interface MonthActivitiesSummaryProps {
  monthDate: Date;
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}

export function MonthActivitiesSummary({
  monthDate,
  activitiesFilters,
  onActivitiesFiltersChange,
}: MonthActivitiesSummaryProps) {
  const categories = useActivities((state) => state.activityCategories);
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = useCurrencyFormatter();

  // Types are derived from the accounts, not a property of categories, so a
  // category joins a type's section whenever one of its activities carries
  // that type — the same category can appear under several types.
  const getCategories = (activityType: ActivityType) =>
    categories
      .filter((category) =>
        activities.some(
          (a) =>
            a.category === category.id &&
            a.types.includes(activityType) &&
            a.date.getMonth() === monthDate.getMonth() &&
            a.date.getFullYear() === monthDate.getFullYear(),
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

  const getTypeTotal = (activityType: ActivityType) =>
    getActivityTypeTotalForMonth({
      monthDate,
      activityType,
      activities,
    });

  const getProgressBarColor = (
    index: number,
    activityType: ActivityType,
    count: number,
  ) => {
    const color = new Color(
      {
        [ActivityType.REVENUE]: "#4ade80",
        [ActivityType.EXPENSE]: "#f87171",
        [ActivityType.INVESTMENT]: "#fb923c",
        [ActivityType.NEUTRAL]: "#9ca3af",
      }[activityType],
    );
    color.lch.l = 80 + (index / count) * -50;
    return color;
  };

  const activityTypes = [
    ActivityType.REVENUE,
    ActivityType.EXPENSE,
    ActivityType.INVESTMENT,
    ActivityType.NEUTRAL,
  ].map((type) => ({ type, value: getTypeTotal(type) }));

  return (
    <div>
      {activityTypes.map((activityType) => {
        const typeCategories = getCategories(activityType.type);

        return (
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
                <span className="text-sm font-medium">
                  {ACTIVITY_TYPES_NAME[activityType.type]}
                </span>
              </div>

              <div className="flex items-center">
                <div
                  className={cn("mr-4 text-sm text-muted-foreground", {
                    "hidden group-hover:block":
                      activitiesFilters.activityType !== activityType.type,
                  })}
                >
                  {activitiesFilters.activityType === activityType.type
                    ? "Clear filter"
                    : "Filter"}
                </div>

                <div className="text-right font-mono text-sm font-medium whitespace-nowrap tabular-nums">
                  {currencyFormatter.format(activityType.value)}
                </div>
              </div>
            </div>

            {activityType.value !== 0 && (
              <div className="mt-1 mb-2 px-2">
                <div className="flex h-2 w-full items-center overflow-hidden rounded-md bg-muted transition-all hover:h-4">
                  {typeCategories.map((category, index) => {
                    const categoryValue = getActivityCategoryTotalForMonth({
                      monthDate,
                      categoryId: category.id,
                      activityType: activityType.type,
                      activities,
                    });
                    const percentage =
                      (categoryValue / activityType.value) * 100;
                    const color = getProgressBarColor(
                      index,
                      activityType.type,
                      typeCategories.length,
                    );

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
                          {category.name} ({Math.round(percentage * 100) / 100}
                          %)
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}

            {typeCategories.map((category) => (
              <MonthActivityCategoryLine
                key={category.id}
                monthDate={monthDate}
                category={category}
                activityType={activityType.type}
                activitiesFilters={activitiesFilters}
                onActivitiesFiltersChange={onActivitiesFiltersChange}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
