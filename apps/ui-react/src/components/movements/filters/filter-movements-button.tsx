import type { MovementFilter } from "@maille/core/movements";

import { FilterPicker } from "@/components/shared/filter-picker";
import { useViews } from "@/stores/views";

import { useMovementFilterFields } from "./movement-filter-fields";

interface FilterMovementsButtonProps {
  /** The store-backed view to filter; ignored when filters is provided. */
  viewId?: string;
  /** Filters to edit directly (a custom view); overrides viewId. */
  filters?: MovementFilter[];
  onFiltersChange?: (filters: MovementFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

export function FilterMovementsButton({
  viewId,
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterMovementsButtonProps) {
  const fields = useMovementFilterFields();
  const storeView = useViews((state) =>
    viewId === undefined ? undefined : state.getMovementView(viewId),
  );
  const setMovementView = useViews((state) => state.setMovementView);

  const currentFilters = filters ?? storeView?.filters ?? [];

  const setFilters = (nextFilters: MovementFilter[]) => {
    if (onFiltersChange !== undefined) {
      onFiltersChange(nextFilters);
    } else if (viewId !== undefined && storeView !== undefined) {
      setMovementView(viewId, { ...storeView, filters: nextFilters });
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
