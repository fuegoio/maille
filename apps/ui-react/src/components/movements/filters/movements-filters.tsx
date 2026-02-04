import * as React from "react";
import { useStore } from "zustand";
import { viewsStore } from "@/stores/views";
import { getCurrencyFormatter } from "@/lib/utils";
import { MovementFilter } from "./movement-filter";
import { FilterMovementsButton } from "./filter-movements-button";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MovementsFiltersProps {
  viewId: string;
  movements: any[]; // Replace with proper Movement type
}

export function MovementsFilters({ viewId, movements }: MovementsFiltersProps) {
  const movementView = useStore(viewsStore, (state) => state.getMovementView(viewId));
  const currencyFormatter = getCurrencyFormatter();

  const movementsTotal = React.useMemo(() => {
    return movements.reduce((total, movement) => total + movement.amount, 0);
  }, [movements]);

  const clearFilters = () => {
    movementView.filters = [];
  };

  if (movementView.filters.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-b py-2 pr-4 pl-4 sm:min-w-[575px] sm:pl-6 md:flex-row md:items-start">
      <div className="flex flex-wrap items-center gap-2">
        {movementView.filters.map((filter, index) => (
          <MovementFilter
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              movementView.filters[index] = newFilter;
            }}
            onDelete={() => {
              movementView.filters.splice(index, 1);
            }}
          />
        ))}

        <FilterMovementsButton viewId={viewId} />
      </div>

      <div className="mt-2 flex flex-1 items-end sm:mt-0 sm:ml-2 sm:items-center">
        <div className="hidden flex-1 sm:block" />

        <div className="mr-4 flex flex-col pr-2 sm:flex-row sm:border-r">
          <div className="my-1 flex items-center px-2 text-right font-mono text-sm">
            {currencyFormatter.format(movementsTotal)}
          </div>
        </div>

        <div className="flex-1 sm:hidden" />

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
