import * as React from "react";
import { useStore } from "zustand";
import { viewsStore } from "@/stores/views";
import { getCurrencyFormatter } from "@/lib/utils";
import { LiabilityFilter } from "./filters/liability-filter";
import { FilterLiabilitiesButton } from "./filters/filter-liabilities-button";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface LiabilitiesFiltersProps {
  viewId: string;
  liabilities: any[]; // Replace with proper Liability type
}

export function LiabilitiesFilters({ viewId, liabilities }: LiabilitiesFiltersProps) {
  const liabilityView = useStore(viewsStore, (state) => state.getLiabilityView(viewId));
  const currencyFormatter = getCurrencyFormatter();

  const liabilitiesTotal = React.useMemo(() => {
    return liabilities.reduce((total, liability) => total + liability.amount, 0);
  }, [liabilities]);

  const clearFilters = () => {
    liabilityView.filters = [];
  };

  if (liabilityView.filters.length === 0) return null;

  return (
    <div className="py-2 flex flex-col md:flex-row md:items-start pl-4 sm:pl-6 pr-4 border-b gap-2 sm:min-w-[575px]">
      <div className="flex items-center gap-2 flex-wrap">
        {liabilityView.filters.map((filter, index) => (
          <LiabilityFilter
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              liabilityView.filters[index] = newFilter;
            }}
            onDelete={() => {
              liabilityView.filters.splice(index, 1);
            }}
          />
        ))}

        <FilterLiabilitiesButton viewId={viewId} />
      </div>

      <div className="flex items-end sm:items-center flex-1 mt-2 sm:mt-0 sm:ml-2">
        <div className="flex-1 hidden sm:block" />

        <div className="flex pr-2 mr-4 sm:border-r flex-col sm:flex-row">
          <div className="text-sm text-right flex items-center px-2 my-1 font-mono">
            {currencyFormatter.format(liabilitiesTotal)}
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