import { type Movement, type MovementFilter } from "@maille/core/movements";

import { Button } from "@/components/ui/button";
import { useViews } from "@/stores/views";

import { FilterMovementsButton } from "./filter-movements-button";
import { MovementFilter as MovementFilterRow } from "./movement-filter";

interface MovementsFiltersProps {
  /** The store-backed view to filter; ignored when filters is provided. */
  viewId?: string;
  movements: Movement[];
  /** Filters to edit directly (a custom view); overrides viewId. */
  filters?: MovementFilter[];
  onFiltersChange?: (filters: MovementFilter[]) => void;
}

export function MovementsFilters({
  viewId,
  filters,
  onFiltersChange,
}: MovementsFiltersProps) {
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

  if (currentFilters.length === 0) return null;

  return (
    <header className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted/50 px-2 sm:pl-11.25">
      <div className="flex flex-wrap items-center gap-2">
        {currentFilters.map((filter, index) => (
          <MovementFilterRow
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

        <FilterMovementsButton
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
      </div>
    </header>
  );
}
