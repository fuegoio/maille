import type { ActivityFilter } from "@maille/core/activities";

import { FilterChip } from "@/components/shared/filter-chip";

import { useActivityFilterFields } from "./activity-filter-fields";

interface ActivityFilterProps {
  modelValue: ActivityFilter;
  onUpdateModelValue: (value: ActivityFilter) => void;
  onDelete: () => void;
}

export function ActivityFilter({
  modelValue,
  onUpdateModelValue,
  onDelete,
}: ActivityFilterProps) {
  const fields = useActivityFilterFields();
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
