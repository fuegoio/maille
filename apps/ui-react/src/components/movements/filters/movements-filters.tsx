import { type Movement } from "@maille/core/movements";

import { Button } from "@/components/ui/button";
import { useViews } from "@/stores/views";

import { MovementFilter } from "./movement-filter";
import { FilterMovementsButton } from "./filter-movements-button";

interface MovementsFiltersProps {
  viewId: string;
  movements: Movement[];
}

export function MovementsFilters({
  viewId,
}: MovementsFiltersProps) {
  const movementView = useViews((state) => state.getMovementView(viewId));
  const setMovementView = useViews((state) => state.setMovementView);

  const clearFilters = () => {
    setMovementView(viewId, {
      ...movementView,
      filters: [],
    });
  };

  if (movementView.filters.length === 0) return null;

  return (
    <header className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted/50 px-2 sm:pl-11.25">
      <div className="flex flex-wrap items-center gap-2">
        {movementView.filters.map((filter, index) => (
          <MovementFilter
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              setMovementView(viewId, {
                ...movementView,
                filters: movementView.filters.map((f, i) =>
                  i === index ? newFilter : f,
                ),
              });
            }}
            onDelete={() => {
              setMovementView(viewId, {
                ...movementView,
                filters: movementView.filters.filter((_, i) => i !== index),
              });
            }}
          />
        ))}

        <FilterMovementsButton viewId={viewId} variant="mini" />
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
      </div>
    </header>
  );
}