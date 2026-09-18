import type { MovementFilter } from "@maille/core/movements";

import {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "@maille/core/activities";
import { MovementFilterFields } from "@maille/core/movements";

import type { FilterPickerField } from "@/components/shared/filter-picker";

import {
  FilterCheckboxList,
  FilterValueInput,
  FilterValueSelect,
} from "@/components/shared/filter-picker";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";

import { MovementFilterIcons } from "./movement-filters-icons";

interface FilterValueProps {
  pending: MovementFilter;
  update: (patch: Partial<MovementFilter>) => void;
}

function checkedValues(pending: MovementFilter): string[] {
  return Array.isArray(pending.value) ? pending.value : [];
}

function toggleValue(props: FilterValueProps, value: string) {
  const current = checkedValues(props.pending);
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
  props.update({ value: next });
}

function AccountFilterValues(props: FilterValueProps) {
  const accounts = useAccounts((state) => state.accounts);
  return (
    <FilterCheckboxList
      values={checkedValues(props.pending)}
      options={accounts.map((account) => ({
        value: account.id,
        label: account.name,
        marker: (
          <span
            aria-hidden
            className={cn(
              "size-3 shrink-0 rounded-full",
              ACCOUNT_TYPES_COLOR[account.type],
            )}
          />
        ),
      }))}
      onToggle={(value) => toggleValue(props, value)}
    />
  );
}

function StatusFilterValues(props: FilterValueProps) {
  return (
    <FilterCheckboxList
      values={checkedValues(props.pending)}
      options={[
        { value: "incomplete", label: "Incomplete" },
        { value: "completed", label: "Completed" },
      ]}
      onToggle={(value) => toggleValue(props, value)}
    />
  );
}

/**
 * The movements the filter picker offers: the shared field list, each
 * with its operators and its value control.
 */
export const MOVEMENT_FILTER_PICKER_FIELDS: FilterPickerField<MovementFilter>[] =
  MovementFilterFields.map((field): FilterPickerField<MovementFilter> => {
    const icon = MovementFilterIcons[field.value];

    switch (field.value) {
      case "name":
        return {
          ...field,
          icon,
          operators: ActivityFilterNameDescriptionOperators,
          defaultOperator: "contains",
          renderValue: (pending, update) => (
            <FilterValueInput
              pending={pending}
              update={update}
              defaultOperator="contains"
              type="text"
              placeholder="Name"
            />
          ),
        };
      case "date":
        return {
          ...field,
          icon,
          operators: ActivityFilterDateOperators,
          defaultOperator: "before",
          renderValue: (pending, update) => (
            <FilterValueSelect
              pending={pending}
              update={update}
              defaultOperator="before"
              options={ActivityFilterDateValues}
            />
          ),
        };
      case "amount":
        return {
          ...field,
          icon,
          operators: ActivityFilterAmountOperators,
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
      case "account":
        return {
          ...field,
          icon,
          operators: ActivityFilterMultipleOperators,
          defaultOperator: "is any of",
          renderValue: (pending, update) => (
            <AccountFilterValues pending={pending} update={update} />
          ),
        };
      case "status":
        return {
          ...field,
          icon,
          operators: ActivityFilterMultipleOperators,
          defaultOperator: "is any of",
          renderValue: (pending, update) => (
            <StatusFilterValues pending={pending} update={update} />
          ),
        };
    }
  });
