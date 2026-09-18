import type { TransactionFilter } from "@maille/core/views";

import { FilterChip } from "@/components/shared/filter-chip";

import { TRANSACTION_FILTER_FIELDS } from "./transaction-filter-fields";

interface TransactionFilterProps {
  modelValue: TransactionFilter;
  onUpdateModelValue: (value: TransactionFilter) => void;
  onDelete: () => void;
}

export function TransactionFilter({
  modelValue,
  onUpdateModelValue,
  onDelete,
}: TransactionFilterProps) {
  const fields = TRANSACTION_FILTER_FIELDS;
  const field = fields.find((entry) => entry.value === modelValue.field);
  if (!field) return null;
  return (
    <FilterChip
      field={field}
      filter={modelValue}
      onChange={onUpdateModelValue}
      onDelete={onDelete}
    />
  );
}
