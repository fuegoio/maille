import type { TransactionFilter } from "@maille/core/views";

import { FilterPicker } from "@/components/shared/filter-picker";

import { TRANSACTION_FILTER_FIELDS } from "./transaction-filter-fields";

interface FilterTransactionsButtonProps {
  filters: TransactionFilter[];
  onFiltersChange: (filters: TransactionFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

export function FilterTransactionsButton({
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterTransactionsButtonProps) {
  return (
    <FilterPicker
      fields={TRANSACTION_FILTER_FIELDS}
      filters={filters}
      onFiltersChange={onFiltersChange}
      variant={variant}
      className={className}
    />
  );
}
