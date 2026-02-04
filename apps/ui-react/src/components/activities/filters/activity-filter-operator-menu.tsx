import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  modelValue: ActivityFilter["operator"] | undefined;
  field: ActivityFilter["field"];
  onUpdateModelValue: (value: ActivityFilter["operator"]) => void;
  onClose: () => void;
}

export const ActivityFilterOperatorMenu = forwardRef<
  { click: () => void },
  ActivityFilterOperatorMenuProps
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
    else if (field === "name" || field === "description")
      return ActivityFilterNameDescriptionOperators;
    else if (field === "amount") return ActivityFilterAmountOperators;
    else if (field === "type" || field === "from_account" || field === "to_account")
      return ActivityFilterMultipleOperators;
    else if (field === "category" || field === "subcategory")
      return [...ActivityFilterMultipleOperators, ...ActivityFilterCategoryOperators];
    return [];
  };

  const operators = getOperators();

  return (
    <Select
      value={modelValue}
      onValueChange={(value) => {
        onUpdateModelValue(value as ActivityFilter["operator"]);
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
        className={`flex items-center px-2 text-sm h-7 text-primary-100 hover:text-white hover:bg-primary-700 transition-colors border-r min-w-[24px] shrink-0 ${
          open ? "bg-primary-700 text-white" : ""
        }`}
      >
        <SelectValue placeholder="Operator" />
        <ChevronDown className="size-4 ml-1" />
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

ActivityFilterOperatorMenu.displayName = "ActivityFilterOperatorMenu";
