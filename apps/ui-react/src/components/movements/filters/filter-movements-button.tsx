import type { MovementFilter } from "@maille/core/movements";

import { OperatorsWithoutValue } from "@maille/core/movements";

import { FilterPicker } from "@/components/shared/filter-picker";
import { isEmptyFilterValue } from "@/components/shared/filter-picker-state";
import { useViews } from "@/stores/views";

import { MOVEMENT_FILTER_PICKER_FIELDS } from "./movement-filter-fields";

interface FilterMovementsButtonProps {
  /** The store-backed view to filter; ignored when filters is provided. */
  viewId?: string;
  /** Filters to edit directly (a custom view); overrides viewId. */
  filters?: MovementFilter[];
  onFiltersChange?: (filters: MovementFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

/**
 * A filter is complete once its operator is set and its value carries
 * a constraint; "is defined"-style operators need no value.
 */
function isComplete(filter: MovementFilter): boolean {
  return (
    filter.operator !== undefined &&
    ((OperatorsWithoutValue as readonly string[]).includes(
      filter.operator as string,
    ) ||
      !isEmptyFilterValue(filter.value))
  );
}

export function FilterMovementsButton({
  viewId,
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterMovementsButtonProps) {
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
      fields={MOVEMENT_FILTER_PICKER_FIELDS}
      emptyFilter={(field) =>
        ({ field, operator: undefined, value: undefined }) as MovementFilter
      }
      isComplete={isComplete}
      filters={currentFilters}
      onFiltersChange={setFilters}
      variant={variant}
      className={className}
    />
  );
}
