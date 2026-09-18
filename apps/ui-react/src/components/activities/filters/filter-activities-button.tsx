import type { ActivityFilter } from "@maille/core/activities";

import { useActivityFilterFields } from "@/components/activities/filters/activity-filter-fields";
import { FilterPicker } from "@/components/shared/filter-picker";
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

export function FilterActivitiesButton({
  viewId,
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterActivitiesButtonProps) {
  const fields = useActivityFilterFields();
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
      fields={fields}
      filters={currentFilters}
      onFiltersChange={setFilters}
      variant={variant}
      className={className}
    />
  );
}
