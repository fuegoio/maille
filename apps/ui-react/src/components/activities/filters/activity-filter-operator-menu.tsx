import {
  ActivityFilterAmountOperators,
  ActivityFilterCategoryOperators,
  ActivityFilterDateOperators,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "@maille/core/activities";
import type { ActivityFilter } from "@maille/core/activities";
import { forwardRef, useImperativeHandle, useRef } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityFilterOperatorMenuProps {
  modelValue: ActivityFilter["operator"] | undefined;
  field: ActivityFilter["field"];
  onUpdateModelValue: (value: ActivityFilter["operator"]) => void;
}

export const ActivityFilterOperatorMenu = forwardRef<
  { click: () => void },
  ActivityFilterOperatorMenuProps
>(({ modelValue, field, onUpdateModelValue }, ref) => {
  const selectRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({
    click: () => {
      selectRef.current?.click();
    },
  }));

  const getOperators = (): readonly string[] => {
    if (field === "date") return ActivityFilterDateOperators;
    else if (field === "name" || field === "description")
      return ActivityFilterNameDescriptionOperators;
    else if (field === "amount") return ActivityFilterAmountOperators;
    else if (
      field === "type" ||
      field === "from_account" ||
      field === "to_account"
    )
      return ActivityFilterMultipleOperators;
    else if (field === "category" || field === "subcategory")
      return [
        ...ActivityFilterMultipleOperators,
        ...ActivityFilterCategoryOperators,
      ];
    return [];
  };

  const operators = getOperators();

  return (
    <Select
      value={modelValue}
      onValueChange={(value) => {
        onUpdateModelValue(value as ActivityFilter["operator"]);
      }}
    >
      <SelectTrigger
        ref={selectRef}
        className="h-6 border-none px-2 text-xs focus-visible:ring-0"
        noChevron
      >
        <SelectValue placeholder="Operator" />
      </SelectTrigger>
      <SelectContent>
        {operators.map((operator) => (
          <SelectItem key={operator} value={operator}>
            {operator}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

ActivityFilterOperatorMenu.displayName = "ActivityFilterOperatorMenu";
