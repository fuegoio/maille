import * as React from "react";
import { useViews } from "@/stores/views";
import { getCurrencyFormatter } from "@/lib/utils";
import { LiabilityFilter } from "./liability-filter";
import { FilterLiabilitiesButton } from "./filter-liabilities-button";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface LiabilitiesFiltersProps {
  viewId: string;
  liabilities: any[]; // Replace with proper Liability type
}

export function LiabilitiesFilters({ viewId, liabilities }: LiabilitiesFiltersProps) {
  const liabilityView = useViews((state) => state.getLiabilityView(viewId));
  const currencyFormatter = getCurrencyFormatter();

  const liabilitiesTotal = React.useMemo(() => {
    return liabilities.reduce((total, liability) => total + liability.amount, 0);
  }, [liabilities]);

  const clearFilters = () => {
    liabilityView.filters = [];
  };

  if (liabilityView.filters.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-b py-2 pr-4 pl-4 sm:min-w-[575px] sm:pl-6 md:flex-row md:items-start">
      <div className="flex flex-wrap items-center gap-2">
        {liabilityView.filters.map((filter, index) => (
          <LiabilityFilter
            key={index}
            modelValue={filter}
            onUpdateModelValue={(newFilter: any) => {
              liabilityView.filters[index] = newFilter;
            }}
            onDelete={() => {
              liabilityView.filters.splice(index, 1);
            }}
          />
        ))}

        <FilterLiabilitiesButton viewId={viewId} />
      </div>

      <div className="mt-2 flex flex-1 items-end sm:mt-0 sm:ml-2 sm:items-center">
        <div className="hidden flex-1 sm:block" />

        <div className="mr-4 flex flex-col pr-2 sm:flex-row sm:border-r">
          <div className="my-1 flex items-center px-2 text-right font-mono text-sm">
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
