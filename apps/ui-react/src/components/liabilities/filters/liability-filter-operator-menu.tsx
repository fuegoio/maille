import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "@maille/core/activities";
import type { LiabilityFilter } from "@maille/core/liabilities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LiabilityFilterOperatorMenuProps {
  modelValue: LiabilityFilter["operator"] | undefined;
  field: LiabilityFilter["field"];
  onUpdateModelValue: (value: LiabilityFilter["operator"]) => void;
  onClose: () => void;
}

export const LiabilityFilterOperatorMenu = forwardRef<
  { click: () => void },
  LiabilityFilterOperatorMenuProps
>(({ modelValue, field, onUpdateModelValue, onClose }, ref) => {
  const selectRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    click: () => {
      selectRef.current?.click();
    },
  }));

  const getOperators = (): readonly string[] => {
    if (field === "date") return ActivityFilterDateOperators;
    else if (field === "name") return ActivityFilterNameDescriptionOperators;
    else if (field === "amount") return ActivityFilterAmountOperators;
    else if (field === "account") return ActivityFilterMultipleOperators;
    return [];
  };

  const operators = getOperators();

  return (
    <Select
      value={modelValue}
      onValueChange={(value) => {
        onUpdateModelValue(value as LiabilityFilter["operator"]);
      }}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <SelectTrigger
        ref={selectRef}
        className={`text-primary-100 hover:bg-primary-700 flex h-7 min-w-[24px] shrink-0 items-center border-r px-2 text-sm transition-colors hover:text-white ${
          open ? "bg-primary-700 text-white" : ""
        }`}
      >
        <SelectValue placeholder="Operator" />
        <ChevronDown className="ml-1 size-4" />
      </SelectTrigger>
      <SelectContent className="bg-primary-800 border-primary-600">
        {operators.map((operator) => (
          <SelectItem
            key={operator}
            value={operator}
            className="text-primary-100 hover:bg-primary-700"
          >
            {operator}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

LiabilityFilterOperatorMenu.displayName = "LiabilityFilterOperatorMenu";
