import type { Account } from "@maille/core/accounts";
import type { ReactNode } from "react";

import {
  ActivityFilterAmountOperators,
  ActivityFilterCategoryOperators,
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityFilterFields,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
  ActivityType,
  type ActivityFilter,
} from "@maille/core/activities";

import type { FilterPickerField } from "@/components/shared/filter-picker";

import {
  FilterCheckboxList,
  FilterValueInput,
  FilterValueSelect,
} from "@/components/shared/filter-picker";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";

import { ActivityFilterIcons } from "./activity-filters-icons";

/** Props every per-field value control receives. */
interface FilterValueProps {
  pending: ActivityFilter;
  update: (patch: Partial<ActivityFilter>) => void;
}

function checkedValues(pending: ActivityFilter): string[] {
  return Array.isArray(pending.value) ? pending.value : [];
}

function toggleValue(props: FilterValueProps, value: string) {
  const current = checkedValues(props.pending);
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
  props.update({ value: next });
}

function TypeFilterValues(props: FilterValueProps) {
  const toggle = (value: string) => toggleValue(props, value);
  return (
    <FilterCheckboxList
      values={checkedValues(props.pending)}
      options={Object.values(ActivityType).map((type) => ({
        value: type,
        label: ACTIVITY_TYPES_NAME[type],
        marker: (
          <span
            aria-hidden
            className={cn(
              "size-3 shrink-0 rounded-full",
              ACTIVITY_TYPES_COLOR[type],
            )}
          />
        ),
      }))}
      onToggle={toggle}
    />
  );
}

function CategoryFilterValues(props: FilterValueProps) {
  const categories = useActivities((state) => state.activityCategories);
  return (
    <FilterCheckboxList
      values={checkedValues(props.pending)}
      options={categories.map((category) => ({
        value: category.id,
        label: category.name,
        marker: category.emoji ? (
          <span aria-hidden className="text-[13px] leading-none">
            {category.emoji}
          </span>
        ) : undefined,
      }))}
      onToggle={(value) => toggleValue(props, value)}
    />
  );
}

function SubcategoryFilterValues(props: FilterValueProps) {
  const subcategories = useActivities((state) => state.activitySubcategories);
  return (
    <FilterCheckboxList
      values={checkedValues(props.pending)}
      options={subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name,
        marker: subcategory.emoji ? (
          <span aria-hidden className="text-[13px] leading-none">
            {subcategory.emoji}
          </span>
        ) : undefined,
      }))}
      onToggle={(value) => toggleValue(props, value)}
    />
  );
}

function AccountFilterValues(props: FilterValueProps) {
  const accounts = useAccounts((state) => state.accounts);
  const marker = (type: Account["type"]): ReactNode => (
    <span
      aria-hidden
      className={cn("size-3 shrink-0 rounded-full", ACCOUNT_TYPES_COLOR[type])}
    />
  );
  return (
    <FilterCheckboxList
      values={checkedValues(props.pending)}
      options={accounts.map((account) => ({
        value: account.id,
        label: account.name,
        marker: marker(account.type),
      }))}
      onToggle={(value) => toggleValue(props, value)}
    />
  );
}

function textValue(
  pending: ActivityFilter,
  update: FilterValueProps["update"],
) {
  return (
    <FilterValueInput
      pending={pending}
      update={update}
      defaultOperator="contains"
      type="text"
      placeholder={pending.field === "name" ? "Name" : "Description"}
    />
  );
}

/**
 * The activities the filter picker offers: the shared field list, each
 * with its operators and its value control.
 */
export const ACTIVITY_FILTER_PICKER_FIELDS: FilterPickerField<ActivityFilter>[] =
  ActivityFilterFields.map((field): FilterPickerField<ActivityFilter> => {
    const icon = ActivityFilterIcons[field.value];

    switch (field.value) {
      case "name":
      case "description":
        return {
          ...field,
          icon,
          operators: ActivityFilterNameDescriptionOperators,
          defaultOperator: "contains",
          renderValue: textValue,
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
      case "type":
        return {
          ...field,
          icon,
          operators: ActivityFilterMultipleOperators,
          defaultOperator: "is any of",
          renderValue: (pending, update) => (
            <TypeFilterValues pending={pending} update={update} />
          ),
        };
      case "category":
      case "subcategory":
        return {
          ...field,
          icon,
          operators: [
            ...ActivityFilterMultipleOperators,
            ...ActivityFilterCategoryOperators,
          ],
          operatorsWithoutValue: ActivityFilterCategoryOperators,
          defaultOperator: "is any of",
          renderValue: (pending, update) =>
            field.value === "category" ? (
              <CategoryFilterValues pending={pending} update={update} />
            ) : (
              <SubcategoryFilterValues pending={pending} update={update} />
            ),
        };
      case "from_account":
      case "to_account":
        return {
          ...field,
          icon,
          operators: ActivityFilterMultipleOperators,
          defaultOperator: "is any of",
          renderValue: (pending, update) => (
            <AccountFilterValues pending={pending} update={update} />
          ),
        };
    }
  });
