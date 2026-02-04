import * as React from "react";
import { useStore } from "zustand";
import { viewsStore } from "@/stores/views";
import { ActivityType, type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { ActivityFilter } from "./filters/activity-filter";
import { FilterActivitiesButton } from "./filters/filter-activities-button";
import { ExportActivitiesButton } from "./export-activities-button";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Activity type colors mapping
const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red",
  [ActivityType.REVENUE]: "green",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "slate",
};

interface ActivitiesFiltersProps {
  viewId: string;
  activities: Activity[];
}

export function ActivitiesFilters({ viewId, activities }: ActivitiesFiltersProps) {
  const activityView = useStore(viewsStore, (state) => state.getActivityView(viewId));
  const currencyFormatter = getCurrencyFormatter();

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
    activityView.filters = [];
  };

  if (activityView.filters.length === 0) return null;

  return (
    <div className="py-2 flex flex-col md:flex-row md:items-start pl-4 sm:pl-6 pr-4 border-b gap-2 sm:min-w-[575px]">
      <div className="flex items-center gap-2 flex-wrap">
        {activityView.filters.map((filter, index) => (
          <ActivityFilter
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              activityView.filters[index] = newFilter;
            }}
            onDelete={() => {
              activityView.filters.splice(index, 1);
            }}
          />
        ))}

        <FilterActivitiesButton viewId={viewId} />
      </div>

      <div className="flex items-end sm:items-center flex-1 mt-2 sm:mt-0 sm:ml-2">
        <div className="flex-1 hidden sm:block" />

        <div className="flex pr-2 mr-4 sm:border-r flex-col sm:flex-row">
          {[ActivityType.INVESTMENT, ActivityType.REVENUE, ActivityType.EXPENSE].map(
            (activityType) => (
              activitiesTotal[activityType] && (
                <div
                  key={activityType}
                  className="text-sm text-right flex items-center px-2 my-1 font-mono"
                >
                  <div
                    className={`h-[9px] w-[9px] rounded-xs shrink-0 mr-3 bg-${ACTIVITY_TYPES_COLOR[activityType]}-300`}
                  />
                  {currencyFormatter.format(activitiesTotal[activityType]!)}
                </div>
              )
            )
          )}
        </div>

        <div className="flex-1 sm:hidden" />

        <ExportActivitiesButton
          className="mr-2"
          viewId={viewId}
          activities={activities}
        />
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={clearFilters}
        >
          <span>Clear</span>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}