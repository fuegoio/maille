import type { TransactionFilter } from "@maille/core/views";

import { FilterPicker } from "@/components/shared/filter-picker";
import { useViews } from "@/stores/views";

import { TRANSACTION_FILTER_FIELDS } from "./transaction-filter-fields";

interface FilterTransactionsButtonProps {
  /** The store-backed view to filter; ignored when filters is provided. */
  viewId?: string;
  /** Filters to edit directly (a custom view); overrides viewId. */
  filters?: TransactionFilter[];
  onFiltersChange?: (filters: TransactionFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

export function FilterTransactionsButton({
  viewId,
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterTransactionsButtonProps) {
  const storeView = useViews((state) =>
    viewId === undefined ? undefined : state.getTransactionView(viewId),
  );
  const setTransactionView = useViews((state) => state.setTransactionView);

  const currentFilters = filters ?? storeView?.filters ?? [];

  const setFilters = (nextFilters: TransactionFilter[]) => {
    if (onFiltersChange !== undefined) {
      onFiltersChange(nextFilters);
    } else if (viewId !== undefined && storeView !== undefined) {
      setTransactionView(viewId, { ...storeView, filters: nextFilters });
    }
  };

  return (
    <FilterPicker
      fields={TRANSACTION_FILTER_FIELDS}
      filters={currentFilters}
      onFiltersChange={setFilters}
      variant={variant}
      className={className}
    />
  );
}
