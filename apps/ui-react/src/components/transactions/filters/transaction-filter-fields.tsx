import type { TransactionFilter } from "@maille/core/views";

import { TransactionFilterFields } from "@maille/core/views";
import {
  TransactionFilterAmountOperators,
  TransactionFilterDateOperators,
  TransactionFilterDateValues,
  TransactionFilterIsOperators,
  TransactionFilterMultipleOperators,
} from "@maille/core/views";

import type { FilterPickerField } from "@/components/shared/filter-picker";

import {
  FilterCheckboxList,
  FilterValueInput,
  FilterValueSelect,
} from "@/components/shared/filter-picker";

import { TransactionFilterIcons } from "./transaction-filters-icons";

interface FilterValueProps {
  pending: TransactionFilter;
  update: (patch: Partial<TransactionFilter>) => void;
}

function checkedValues(pending: TransactionFilter): string[] {
  return Array.isArray(pending.value) ? pending.value : [];
}

function toggleValue(props: FilterValueProps, value: string) {
  const current = checkedValues(props.pending);
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
  props.update({ value: next });
}

function DirectionFilterValues(props: FilterValueProps) {
  return (
    <FilterCheckboxList
      values={
        typeof props.pending.value === "string" ? [props.pending.value] : []
      }
      options={[
        { value: "in", label: "In" },
        { value: "out", label: "Out" },
      ]}
      onToggle={(value) => {
        if (value !== "in" && value !== "out") return;
        props.update({
          field: "direction",
          operator: props.pending.operator === "is not" ? "is not" : "is",
          value: props.pending.value === value ? undefined : value,
        });
      }}
    />
  );
}

function StatusFilterValues(props: FilterValueProps) {
  return (
    <FilterCheckboxList
      values={checkedValues(props.pending)}
      options={[
        { value: "scheduled", label: "Scheduled" },
        { value: "incomplete", label: "Incomplete" },
        { value: "completed", label: "Completed" },
      ]}
      onToggle={(value) => toggleValue(props, value)}
    />
  );
}

/**
 * The transaction rows a filter picker offers: the shared field list,
 * each with its operators and its value control.
 */
export const TRANSACTION_FILTER_PICKER_FIELDS: FilterPickerField<TransactionFilter>[] =
  TransactionFilterFields.map((field): FilterPickerField<TransactionFilter> => {
    const icon = TransactionFilterIcons[field.value];

    switch (field.value) {
      case "date":
        return {
          ...field,
          icon,
          operators: TransactionFilterDateOperators,
          defaultOperator: "before",
          renderValue: (pending, update) => (
            <FilterValueSelect
              pending={pending}
              update={update}
              defaultOperator="before"
              options={TransactionFilterDateValues}
            />
          ),
        };
      case "amount":
        return {
          ...field,
          icon,
          operators: TransactionFilterAmountOperators,
          defaultOperator: "equal",
          renderValue: (pending, update) => (
            <FilterValueInput
              pending={pending}
              update={update}
              defaultOperator="equal"
              type="number"
              placeholder="Amount"
            />
          ),
        };
      case "direction":
        return {
          ...field,
          icon,
          operators: TransactionFilterIsOperators,
          defaultOperator: "is",
          renderValue: (pending, update) => (
            <DirectionFilterValues pending={pending} update={update} />
          ),
        };
      case "status":
        return {
          ...field,
          icon,
          operators: TransactionFilterMultipleOperators,
          defaultOperator: "is any of",
          renderValue: (pending, update) => (
            <StatusFilterValues pending={pending} update={update} />
          ),
        };
    }
  });
