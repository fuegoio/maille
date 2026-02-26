import { ActivityType } from "@maille/core/activities";
import Color from "colorjs.io";

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

import { MonthActivityCategoryLine } from "./month-activity-category-line";

interface MonthActivitiesSummaryProps {
  monthDate: Date;
}

export function MonthActivitiesSummary({
  monthDate,
}: MonthActivitiesSummaryProps) {
  const categories = useActivities((state) => state.activityCategories);
  const activities = useActivities((state) => state.activities);

  const viewFilters = {
    activityType: null,
    category: null,
    subcategory: null,
  };

  const getCategories = (activityType: ActivityType) => {
    return categories
      .filter((c) => c.type === activityType)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

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

  const getActivityTypeTotalForMonth = (
    date: Date,
    activityType: ActivityType,
  ) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return activities
      .filter((a) => a.type === activityType)
      .filter((a) => a.date >= startOfMonth && a.date <= endOfMonth)
      .reduce((total, a) => total + a.amount, 0);
  };

  const currencyFormatter = useCurrencyFormatter();

  const getCategoryTotalForMonth = (date: Date, category: string) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return activities
      .filter((a) => a.category === category)
      .filter((a) => a.date >= startOfMonth && a.date <= endOfMonth)
      .reduce((total, a) => total + a.amount, 0);
  };

  const activityTypes = [
    {
      type: ActivityType.REVENUE,
      value: getActivityTypeTotalForMonth(monthDate, ActivityType.REVENUE),
    },
    {
      type: ActivityType.EXPENSE,
      value: getActivityTypeTotalForMonth(monthDate, ActivityType.EXPENSE),
    },
    {
      type: ActivityType.INVESTMENT,
      value: getActivityTypeTotalForMonth(monthDate, ActivityType.INVESTMENT),
    },
    {
      type: ActivityType.NEUTRAL,
      value: getActivityTypeTotalForMonth(monthDate, ActivityType.NEUTRAL),
    },
  ];

  return (
    <div>
      {activityTypes.map((activityType) => (
        <div key={activityType.type} className="w-full border-b px-3 py-4">
          <div
            className={`group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors ${
              viewFilters.activityType === activityType.type
                ? "bg-primary-800"
                : "hover:bg-primary-800"
            }`}
          >
            <div className="flex items-center">
              <div
                className={cn(
                  `mr-2 size-3 shrink-0 rounded-full`,
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
                  viewFilters.activityType === activityType.type
                    ? ""
                    : "hidden group-hover:block"
                }`}
              >
                {viewFilters.activityType === activityType.type
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
                {categories
                  .filter((c) => c.type === activityType.type)
                  .map((category, index) => {
                    const categoryValue = getCategoryTotalForMonth(
                      monthDate,
                      category.id,
                    );
                    const percentage =
                      (categoryValue / activityType.value) * 100;

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
                          {category.name} ({Math.round(percentage * 100) / 100}
                          %)
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
              </div>
            </div>
          )}

          {getCategories(activityType.type).map((category) => (
            <MonthActivityCategoryLine
              key={category.id}
              monthDate={monthDate}
              category={category}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
