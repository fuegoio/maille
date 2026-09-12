import { ActivityType, sumActivityAmounts } from "@maille/core/activities";

import type { ActivitiesFilters } from "@/types/activities";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
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

  const monthActivities = activities.filter(
    (a) =>
      a.date.getMonth() === monthDate.getMonth() &&
      a.date.getFullYear() === monthDate.getFullYear(),
  );

  // Types are derived from the accounts, not a property of categories, so
  // categories are listed flat — each line carries its per-type amounts.
  // The type totals stay as a filterable overview of the month's flows.
  const monthAmounts = sumActivityAmounts(monthActivities);

  const usedCategories = categories
    .filter((category) =>
      monthActivities.some(
        (a) =>
          a.category === category.id &&
          Object.values(a.amounts).some((amount) => amount !== 0),
      ),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectType = (activityType: ActivityType) => {
    onActivitiesFiltersChange({
      ...activitiesFilters,
      activityType:
        activitiesFilters.activityType === activityType
          ? undefined
          : activityType,
    });
  };

  return (
    <div>
      <div className="w-full border-b px-3 py-4">
        {[
          ActivityType.REVENUE,
          ActivityType.EXPENSE,
          ActivityType.INVESTMENT,
          ActivityType.NEUTRAL,
        ].map((activityType) => (
          <div
            key={activityType}
            className={cn(
              "group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors",
              {
                "bg-muted": activitiesFilters.activityType === activityType,
                "hover:bg-muted/50":
                  activitiesFilters.activityType !== activityType,
              },
            )}
            onClick={() => selectType(activityType)}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  "mr-2 size-3 shrink-0 rounded-full",
                  ACTIVITY_TYPES_COLOR[activityType],
                )}
              />
              <span className="text-sm font-medium">
                {ACTIVITY_TYPES_NAME[activityType]}
              </span>
            </div>

            <div className="flex items-center">
              <div
                className={`mr-4 text-sm text-muted-foreground ${
                  activitiesFilters.activityType === activityType
                    ? ""
                    : "hidden group-hover:block"
                }`}
              >
                {activitiesFilters.activityType === activityType
                  ? "Clear filter"
                  : "Filter"}
              </div>

              <div className="text-right font-mono text-sm font-medium whitespace-nowrap tabular-nums">
                {currencyFormatter.format(monthAmounts[activityType])}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full px-3 py-4">
        {usedCategories.map((category) => (
          <MonthActivityCategoryLine
            key={category.id}
            monthDate={monthDate}
            category={category}
            activitiesFilters={activitiesFilters}
            onActivitiesFiltersChange={onActivitiesFiltersChange}
          />
        ))}
      </div>
    </div>
  );
}
