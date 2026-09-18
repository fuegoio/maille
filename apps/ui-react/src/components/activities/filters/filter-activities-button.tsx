import {
  OperatorsWithoutValue,
  type ActivityFilter,
} from "@maille/core/activities";

import { ACTIVITY_FILTER_PICKER_FIELDS } from "@/components/activities/filters/activity-filter-fields";
import { FilterPicker } from "@/components/shared/filter-picker";
import { isEmptyFilterValue } from "@/components/shared/filter-picker-state";
import { useViews } from "@/stores/views";

interface FilterActivitiesButtonProps {
  /** The store-backed view to filter; ignored when filters is provided. */
  viewId?: string;
  /** Filters to edit directly (a custom view); overrides viewId. */
  filters?: ActivityFilter[];
  onFiltersChange?: (filters: ActivityFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

/**
 * A filter is complete once its operator is set and its value carries
 * a constraint; "is defined"-style operators need no value.
 */
function isComplete(filter: ActivityFilter): boolean {
  return (
    filter.operator !== undefined &&
    ((OperatorsWithoutValue as readonly string[]).includes(
      filter.operator as string,
    ) ||
      !isEmptyFilterValue(filter.value))
  );
}

export function FilterActivitiesButton({
  viewId,
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterActivitiesButtonProps) {
  const storeView = useViews((state) =>
    viewId === undefined ? undefined : state.getActivityView(viewId),
  );
  const setActivityView = useViews((state) => state.setActivityView);

  const currentFilters = filters ?? storeView?.filters ?? [];

  const setFilters = (nextFilters: ActivityFilter[]) => {
    if (onFiltersChange !== undefined) {
      onFiltersChange(nextFilters);
    } else if (viewId !== undefined && storeView !== undefined) {
      setActivityView(viewId, { ...storeView, filters: nextFilters });
    }
  };

  return (
    <FilterPicker
      fields={ACTIVITY_FILTER_PICKER_FIELDS}
      emptyFilter={(field) =>
        ({ field, operator: undefined, value: undefined }) as ActivityFilter
      }
      isComplete={isComplete}
      filters={currentFilters}
      onFiltersChange={setFilters}
      variant={variant}
      className={className}
    />
  );
}
