import {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "@maille/core/activities";
import {
  type MovementFilter,
  MovementFilterFields,
} from "@maille/core/movements";

import type { FilterFieldDefinition } from "@/components/shared/filter-field-editor";

import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";

import { MovementFilterIcons } from "./movement-filters-icons";

export function useMovementFilterFields(): FilterFieldDefinition<MovementFilter>[] {
  const accounts = useAccounts((state) => state.accounts);
  return MovementFilterFields.map(
    (field): FilterFieldDefinition<MovementFilter> => {
      const base = { ...field, icon: MovementFilterIcons[field.value] };
      switch (field.value) {
        case "name":
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
        case "account":
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
        case "status":
          return {
            ...base,
            operators: ActivityFilterMultipleOperators,
            defaultOperator: "is any of",
            input: {
              type: "multiple",
              pluralLabel: "statuses",
              options: [
                { value: "incomplete", label: "Incomplete" },
                { value: "completed", label: "Completed" },
              ],
            },
          };
      }
    },
  );
}
