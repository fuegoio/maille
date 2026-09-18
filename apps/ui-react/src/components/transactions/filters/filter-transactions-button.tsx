import type { TransactionFilter } from "@maille/core/views";

import { FilterPicker } from "@/components/shared/filter-picker";
import { isEmptyFilterValue } from "@/components/shared/filter-picker-state";

import { TRANSACTION_FILTER_PICKER_FIELDS } from "./transaction-filter-fields";

interface FilterTransactionsButtonProps {
  filters: TransactionFilter[];
  onFiltersChange: (filters: TransactionFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

/** A transaction filter is complete once operator and value are set. */
function isComplete(filter: TransactionFilter): boolean {
  return filter.operator !== undefined && !isEmptyFilterValue(filter.value);
}

export function FilterTransactionsButton({
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterTransactionsButtonProps) {
  return (
    <FilterPicker
      fields={TRANSACTION_FILTER_PICKER_FIELDS}
      emptyFilter={(field) =>
        ({
          field,
          operator: undefined,
          value: undefined,
        }) as unknown as TransactionFilter
      }
      isComplete={isComplete}
      filters={filters}
      onFiltersChange={onFiltersChange}
      variant={variant}
      className={className}
    />
  );
}
