import {
  ActivityFilterAmountOperators,
  ActivityFilterCategoryOperators,
  ActivityFilterDateOperators,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "@maille/core/activities";
import type { ActivityFilter } from "@maille/core/activities";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityFilterOperatorMenuProps {
  open?: boolean;
  modelValue: ActivityFilter["operator"] | undefined;
  field: ActivityFilter["field"];
  onUpdateModelValue: (value: ActivityFilter["operator"]) => void;
}

export const ActivityFilterOperatorMenu = ({
  open,
  modelValue,
  field,
  onUpdateModelValue,
}: ActivityFilterOperatorMenuProps) => {
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
      open={open}
      value={modelValue}
      onValueChange={(value) => {
        onUpdateModelValue(value as ActivityFilter["operator"]);
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

ActivityFilterOperatorMenu.displayName = "ActivityFilterOperatorMenu";
