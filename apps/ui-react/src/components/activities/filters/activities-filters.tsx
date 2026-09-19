import type { ActivityFilter } from "@maille/core/activities";

import { sumActivityAmounts, type Activity } from "@maille/core/activities";
import * as React from "react";

import { ActivityAmountsValue } from "@/components/activities/activity-amounts";
import { visibleActivityAmountTypes } from "@/components/activities/activity-view";
import { Button } from "@/components/ui/button";
import { useViews } from "@/stores/views";

import { ActivityFilter as ActivityFilterRow } from "./activity-filter";
import { FilterActivitiesButton } from "./filter-activities-button";

interface ActivitiesFiltersProps {
  /** The store-backed view to filter; ignored when filters is provided. */
  viewId?: string;
  activities: Activity[];
  /** Filters to edit directly (a custom view); overrides viewId. */
  filters?: ActivityFilter[];
  onFiltersChange?: (filters: ActivityFilter[]) => void;
  /** Visible field ids, used for the totals when filters is provided. */
  fields?: string[];
}

export function ActivitiesFilters({
  viewId,
  activities,
  filters,
  onFiltersChange,
  fields,
}: ActivitiesFiltersProps) {
  const storeView = useViews((state) =>
    viewId === undefined ? undefined : state.getActivityView(viewId),
  );
  const setActivityView = useViews((state) => state.setActivityView);

  const currentFilters = filters ?? storeView?.filters ?? [];
  const currentFields = fields ?? storeView?.fields ?? [];

  const setFilters = (nextFilters: ActivityFilter[]) => {
    if (onFiltersChange !== undefined) {
      onFiltersChange(nextFilters);
    } else if (viewId !== undefined && storeView !== undefined) {
      setActivityView(viewId, { ...storeView, filters: nextFilters });
    }
  };

  const activitiesTotal = React.useMemo(
    () => sumActivityAmounts(activities),
    [activities],
  );

  if (currentFilters.length === 0) return null;

  return (
    <header className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted/50 px-2 sm:pl-11.25">
      <div className="flex flex-wrap items-center gap-2">
        {currentFilters.map((filter, index) => (
          <ActivityFilterRow
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              setFilters(
                currentFilters.map((f, i) => (i === index ? newFilter : f)),
              );
            }}
            onDelete={() => {
              setFilters(currentFilters.filter((_, i) => i !== index));
            }}
          />
        ))}

        <FilterActivitiesButton
          filters={currentFilters}
          onFiltersChange={setFilters}
          variant="mini"
        />
      </div>

      <div className="mt-2 flex flex-1 items-end sm:mt-0 sm:ml-2 sm:items-center">
        <div className="hidden flex-1 sm:block" />

        <Button
          variant="ghost"
          onClick={() => setFilters([])}
          size="sm"
          className="mr-2"
        >
          Clear
        </Button>

        {/* Right edge matches the row amounts below: rows inset an extra
         * 16px at lg via lg:pr-6 on top of the header's px-2. */}
        <ActivityAmountsValue
          amounts={activitiesTotal}
          types={visibleActivityAmountTypes(currentFields)}
          className="text-sm lg:pr-4"
          animated
        />
      </div>
    </header>
  );
}
