import {
  type TransactionFilter,
  TransactionFilterFields,
  TransactionFilterAmountOperators,
  TransactionFilterDateOperators,
  TransactionFilterDateValues,
  TransactionFilterIsOperators,
  TransactionFilterMultipleOperators,
} from "@maille/core/views";

import type { FilterFieldDefinition } from "@/components/shared/filter-field-editor";

import { TransactionFilterIcons } from "./transaction-filters-icons";

export const TRANSACTION_FILTER_FIELDS: FilterFieldDefinition<TransactionFilter>[] =
  TransactionFilterFields.map(
    (field): FilterFieldDefinition<TransactionFilter> => {
      const base = { ...field, icon: TransactionFilterIcons[field.value] };
      switch (field.value) {
        case "date":
          return {
            ...base,
            operators: TransactionFilterDateOperators,
            input: {
              type: "single",
              options: TransactionFilterDateValues.map((value) => ({
                value,
                label: value,
              })),
            },
          };
        case "amount":
          return {
            ...base,
            operators: TransactionFilterAmountOperators,
            input: { type: "number" },
          };
        case "direction":
          return {
            ...base,
            operators: TransactionFilterIsOperators,
            input: {
              type: "single",
              options: [
                { value: "in", label: "In" },
                { value: "out", label: "Out" },
              ],
            },
          };
        case "status":
          return {
            ...base,
            operators: TransactionFilterMultipleOperators,
            input: {
              type: "multiple",
              pluralLabel: "statuses",
              options: [
                { value: "scheduled", label: "Scheduled" },
                { value: "incomplete", label: "Incomplete" },
                { value: "completed", label: "Completed" },
              ],
            },
          };
      }
    },
  );
