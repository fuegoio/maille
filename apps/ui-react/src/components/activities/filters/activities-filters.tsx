import { ActivityType, type Activity } from "@maille/core/activities";
import { X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES_COLOR } from "@/stores/activities";
import { useViews } from "@/stores/views";

import { ActivityFilter } from "./activity-filter";
import { FilterActivitiesButton } from "./filter-activities-button";

interface ActivitiesFiltersProps {
  viewId: string;
  activities: Activity[];
}

export function ActivitiesFilters({
  viewId,
  activities,
}: ActivitiesFiltersProps) {
  const activityView = useViews((state) => state.getActivityView(viewId));
  const setActivityView = useViews((state) => state.setActivityView);
  const currencyFormatter = useCurrencyFormatter();

  const activitiesTotal = React.useMemo(() => {
    const totals: Partial<Record<ActivityType, number>> = {};

    activities.forEach((a) => {
      if (totals[a.type] === undefined) {
        totals[a.type] = a.amount;
      } else {
        totals[a.type]! += a.amount;
      }
    });

    return totals;
  }, [activities]);

  const clearFilters = () => {
    setActivityView(viewId, {
      ...activityView,
      filters: [],
    });
  };

  if (activityView.filters.length === 0) return null;

  return (
    <header className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted/50 px-2 sm:pl-11.25">
      <div className="flex flex-wrap items-center gap-2">
        {activityView.filters.map((filter, index) => (
          <ActivityFilter
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              setActivityView(viewId, {
                ...activityView,
                filters: activityView.filters.map((f, i) =>
                  i === index ? newFilter : f,
                ),
              });
            }}
            onDelete={() => {
              setActivityView(viewId, {
                ...activityView,
                filters: activityView.filters.filter((_, i) => i !== index),
              });
            }}
          />
        ))}

        <FilterActivitiesButton viewId={viewId} />
      </div>

      <div className="mt-2 flex flex-1 items-end sm:mt-0 sm:ml-2 sm:items-center">
        <div className="hidden flex-1 sm:block" />

        <Button
          variant="ghost"
          onClick={clearFilters}
          size="sm"
          className="mr-2"
        >
          Clear
        </Button>
        <div className="flex flex-col pr-2 sm:flex-row">
          {[
            ActivityType.INVESTMENT,
            ActivityType.REVENUE,
            ActivityType.EXPENSE,
          ].map((activityType) => {
            return (
              activitiesTotal[activityType] && (
                <div
                  key={activityType}
                  className="my-1 flex items-center px-2 text-right font-mono text-xs"
                >
                  <div
                    className={cn(
                      `mr-2 size-2 shrink-0 rounded-full`,
                      ACTIVITY_TYPES_COLOR[activityType],
                    )}
                  />
                  {currencyFormatter.format(activitiesTotal[activityType])}
                </div>
              )
            );
          })}
        </div>
      </div>
    </header>
  );
}
