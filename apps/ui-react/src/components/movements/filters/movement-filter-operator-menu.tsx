import type { MovementFilter } from "@maille/core/movements";
import {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "@maille/core/activities";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MovementFilterOperatorMenuProps {
  open?: boolean;
  modelValue: MovementFilter["operator"] | undefined;
  field: MovementFilter["field"];
  onUpdateModelValue: (value: MovementFilter["operator"]) => void;
}

export const MovementFilterOperatorMenu = ({
  open,
  modelValue,
  field,
  onUpdateModelValue,
}: MovementFilterOperatorMenuProps) => {
  const getOperators = (): readonly string[] => {
    if (field === "date") return ActivityFilterDateOperators;
    else if (field === "name") return ActivityFilterNameDescriptionOperators;
    else if (field === "amount") return ActivityFilterAmountOperators;
    else if (field === "account" || field === "status")
      return ActivityFilterMultipleOperators;
    return [];
  };

  const operators = getOperators();

  return (
    <Select
      open={open}
      value={modelValue}
      onValueChange={(value) => {
        onUpdateModelValue(value as MovementFilter["operator"]);
      }}
    >
      <SelectTrigger noChevron>
        <SelectValue placeholder="Operator" />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {operators.map((operator) => (
          <SelectItem key={operator} value={operator}>
            {operator}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

MovementFilterOperatorMenu.displayName = "MovementFilterOperatorMenu";