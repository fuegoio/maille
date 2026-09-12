import { sumActivityAmounts, type Activity } from "@maille/core/activities";
import * as React from "react";

import { ActivityAmountsValue } from "@/components/activities/activity-amounts";
import { Button } from "@/components/ui/button";
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

  const activitiesTotal = React.useMemo(
    () => sumActivityAmounts(activities),
    [activities],
  );

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

        <FilterActivitiesButton viewId={viewId} variant="mini" />
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

        {/* Right edge matches the row amounts below: rows inset an extra
         * 16px at lg via lg:pr-6 on top of the header's px-2. */}
        <ActivityAmountsValue
          amounts={activitiesTotal}
          className="text-sm lg:pr-4"
        />
      </div>
    </header>
  );
}
