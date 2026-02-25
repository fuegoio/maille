import * as React from "react";
import { useViews } from "@/stores/views";
import { ActivityType, type Activity } from "@maille/core/activities";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { ActivityFilter } from "./activity-filter";
import { FilterActivitiesButton } from "./filter-activities-button";
import { ExportActivitiesButton } from "../export-activities-button";
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
  const activityView = useViews((state) => state.getActivityView(viewId));
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
    activityView.filters = [];
  };

  if (activityView.filters.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-b py-2 pr-4 pl-4 sm:min-w-[575px] sm:pl-6 md:flex-row md:items-start">
      <div className="flex flex-wrap items-center gap-2">
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

      <div className="mt-2 flex flex-1 items-end sm:mt-0 sm:ml-2 sm:items-center">
        <div className="hidden flex-1 sm:block" />

        <div className="mr-4 flex flex-col pr-2 sm:flex-row sm:border-r">
          {[ActivityType.INVESTMENT, ActivityType.REVENUE, ActivityType.EXPENSE].map(
            (activityType) => {
              const typeKey = activityType.toLowerCase() as keyof typeof activitiesTotal;
              return (
                activitiesTotal[typeKey] && (
                  <div
                    key={activityType}
                    className="my-1 flex items-center px-2 text-right font-mono text-sm"
                  >
                    <div
                      className={`bg- mr-3 h-[9px] w-[9px] shrink-0 rounded-xs${ACTIVITY_TYPES_COLOR[activityType]}-300`}
                    />
                    {currencyFormatter.format(activitiesTotal[typeKey]!)}
                  </div>
                )
              );
            },
          )}
        </div>

        <div className="flex-1 sm:hidden" />

        <ExportActivitiesButton className="mr-2" viewId={viewId} activities={activities} />
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
