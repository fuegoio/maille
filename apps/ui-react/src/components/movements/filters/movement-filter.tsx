import type { MovementFilter } from "@maille/core/movements";

import { FilterChip } from "@/components/shared/filter-chip";

import { useMovementFilterFields } from "./movement-filter-fields";

interface MovementFilterProps {
  modelValue: MovementFilter;
  onUpdateModelValue: (value: MovementFilter) => void;
  onDelete: () => void;
}

export function MovementFilter({
  modelValue,
  onUpdateModelValue,
  onDelete,
}: MovementFilterProps) {
  const fields = useMovementFilterFields();
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
