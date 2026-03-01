import {
  MovementFilterFields,
  OperatorsWithoutValue,
  type MovementFilter,
} from "@maille/core/movements";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { MovementFilterOperatorMenu } from "./movement-filter-operator-menu";
import { MovementFilterValueMenu } from "./movement-filter-value-menu";
import { MovementFilterIcons } from "./movement-filters-icons";

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
  const movementFilterField = MovementFilterFields.find(
    (mff) => mff.value === modelValue.field,
  );
  if (!movementFilterField) return null;

  const showValueMenu =
    modelValue.operator !== undefined &&
    !OperatorsWithoutValue.includes(modelValue.operator as any);

  const Icon = MovementFilterIcons[movementFilterField.value];

  return (
    <div className="flex h-6 w-fit max-w-full items-center overflow-hidden rounded border border-input">
      <div className="flex h-7 items-center border-r border-input bg-input/30 px-2 text-xs">
        <Icon className="mr-1 size-3" />
        {movementFilterField.text}
      </div>

      <MovementFilterOperatorMenu
        modelValue={modelValue.operator}
        field={modelValue.field}
        onUpdateModelValue={(operator) => {
          onUpdateModelValue({ ...modelValue, operator } as MovementFilter);
        }}
      />

      {showValueMenu && (
        <MovementFilterValueMenu
          modelValue={modelValue.value}
          field={modelValue.field}
          onUpdateModelValue={(value) => {
            onUpdateModelValue({ ...modelValue, value } as MovementFilter);
          }}
        />
      )}

      <Button
        onClick={onDelete}
        aria-label="Delete filter"
        variant="ghost"
        size="icon"
        className="size-6 rounded-none border-r-0 border-l-0 bg-input/30 hover:bg-input/50"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}