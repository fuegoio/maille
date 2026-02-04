import * as React from "react";
import { useStore } from "zustand";
import { viewsStore } from "@/stores/views";
import { getCurrencyFormatter } from "@/lib/utils";
import { MovementFilter } from "./filters/movement-filter";
import { FilterMovementsButton } from "./filters/filter-movements-button";
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
    <div className="py-2 flex flex-col md:flex-row md:items-start pl-4 sm:pl-6 pr-4 border-b gap-2 sm:min-w-[575px]">
      <div className="flex items-center gap-2 flex-wrap">
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

      <div className="flex items-end sm:items-center flex-1 mt-2 sm:mt-0 sm:ml-2">
        <div className="flex-1 hidden sm:block" />

        <div className="flex pr-2 mr-4 sm:border-r flex-col sm:flex-row">
          <div className="text-sm text-right flex items-center px-2 my-1 font-mono">
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