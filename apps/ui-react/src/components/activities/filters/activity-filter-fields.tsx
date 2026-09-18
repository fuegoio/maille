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

import type { FilterFieldDefinition } from "@/components/shared/filter-field-editor";

import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";

import { ActivityFilterIcons } from "./activity-filters-icons";

export function useActivityFilterFields(): FilterFieldDefinition<ActivityFilter>[] {
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const accounts = useAccounts((state) => state.accounts);

  return ActivityFilterFields.map(
    (field): FilterFieldDefinition<ActivityFilter> => {
      const base = { ...field, icon: ActivityFilterIcons[field.value] };
      switch (field.value) {
        case "name":
        case "description":
          return {
            ...base,
            operators: ActivityFilterNameDescriptionOperators,
            defaultOperator: "contains",
            input: { type: "text" },
          };
        case "date":
          return {
            ...base,
            operators: ActivityFilterDateOperators,
            defaultOperator: "before",
            input: {
              type: "single",
              options: ActivityFilterDateValues.map((value) => ({
                value,
                label: value,
              })),
            },
          };
        case "amount":
          return {
            ...base,
            operators: ActivityFilterAmountOperators,
            defaultOperator: "equal",
            input: { type: "number" },
          };
        case "type":
          return {
            ...base,
            operators: ActivityFilterMultipleOperators,
            defaultOperator: "is any of",
            input: {
              type: "multiple",
              pluralLabel: "types",
              options: Object.values(ActivityType).map((type) => ({
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
              })),
            },
          };
        case "category":
        case "subcategory":
          return {
            ...base,
            operators: [
              ...ActivityFilterMultipleOperators,
              ...ActivityFilterCategoryOperators,
            ],
            operatorsWithoutValue: ActivityFilterCategoryOperators,
            defaultOperator: "is any of",
            input: {
              type: "multiple",
              pluralLabel:
                field.value === "category" ? "categories" : "subcategories",
              options: (field.value === "category"
                ? categories
                : subcategories
              ).map((category) => ({
                value: category.id,
                label: category.name,
                marker: category.emoji ? (
                  <span aria-hidden className="text-[13px] leading-none">
                    {category.emoji}
                  </span>
                ) : undefined,
              })),
            },
          };
        case "from_account":
        case "to_account":
          return {
            ...base,
            operators: ActivityFilterMultipleOperators,
            defaultOperator: "is any of",
            input: {
              type: "multiple",
              pluralLabel: "accounts",
              options: accounts.map((account) => ({
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
              })),
            },
          };
      }
    },
  );
}
