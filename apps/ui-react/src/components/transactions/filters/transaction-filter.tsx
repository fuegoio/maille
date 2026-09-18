import type { TransactionFilter } from "@maille/core/views";

import { TransactionFilterFields } from "@maille/core/views";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { TransactionFilterOperatorMenu } from "./transaction-filter-operator-menu";
import { TransactionFilterValueMenu } from "./transaction-filter-value-menu";
import { TransactionFilterIcons } from "./transaction-filters-icons";

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
  const transactionFilterField = TransactionFilterFields.find(
    (field) => field.value === modelValue.field,
  );
  if (!transactionFilterField) return null;

  const showValueMenu = modelValue.operator !== undefined;

  const Icon = TransactionFilterIcons[transactionFilterField.value];

  return (
    <div className="flex h-6 w-fit max-w-full items-center overflow-hidden rounded border border-input">
      <div className="flex h-7 items-center border-r border-input bg-input/30 px-2 text-xs">
        <Icon className="mr-1 size-3" />
        {transactionFilterField.text}
      </div>

      <TransactionFilterOperatorMenu
        modelValue={modelValue.operator}
        field={modelValue.field}
        onUpdateModelValue={(operator) => {
          onUpdateModelValue({ ...modelValue, operator } as TransactionFilter);
        }}
      />

      {showValueMenu && (
        <TransactionFilterValueMenu
          modelValue={modelValue.value}
          field={modelValue.field}
          onUpdateModelValue={(value) => {
            onUpdateModelValue({ ...modelValue, value } as TransactionFilter);
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
