import type { TransactionFilter } from "@maille/core/views";

import {
  TransactionFilterAmountOperators,
  TransactionFilterDateOperators,
  TransactionFilterIsOperators,
  TransactionFilterMultipleOperators,
} from "@maille/core/views";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionFilterOperatorMenuProps {
  open?: boolean;
  modelValue: TransactionFilter["operator"] | undefined;
  field: TransactionFilter["field"];
  onUpdateModelValue: (value: TransactionFilter["operator"]) => void;
}

export const TransactionFilterOperatorMenu = ({
  open,
  modelValue,
  field,
  onUpdateModelValue,
}: TransactionFilterOperatorMenuProps) => {
  const getOperators = (): readonly string[] => {
    if (field === "date") return TransactionFilterDateOperators;
    else if (field === "amount") return TransactionFilterAmountOperators;
    else if (field === "direction") return TransactionFilterIsOperators;
    else if (field === "status") return TransactionFilterMultipleOperators;
    return [];
  };

  const operators = getOperators();

  return (
    <Select
      open={open}
      value={modelValue}
      onValueChange={(value) => {
        onUpdateModelValue(value as TransactionFilter["operator"]);
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

TransactionFilterOperatorMenu.displayName = "TransactionFilterOperatorMenu";
