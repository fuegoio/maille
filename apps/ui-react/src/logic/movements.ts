import type { Movement } from "@maille/core/movements";

import {
  verifyMovementFilter,
  type MovementFilter,
} from "@maille/core/movements";

import { searchCompare } from "@/lib/strings";

/**
 * The single movement filter pipeline, shared by the tables and the
 * analytics panel so both always describe the same set.
 */
export function applyMovementsFilters(
  movements: Movement[],
  filters: {
    search?: string;
    viewFilters?: MovementFilter[];
    accountFilter?: string | null;
  },
): Movement[] {
  return movements
    .filter((movement) => searchCompare(filters.search ?? "", movement.name))
    .filter((movement) =>
      filters.accountFilter != null
        ? movement.account === filters.accountFilter
        : true,
    )
    .filter((movement) => {
      if (!filters.viewFilters || filters.viewFilters.length === 0) return true;
      return filters.viewFilters
        .map((filter) => verifyMovementFilter(filter, movement))
        .every((f) => f);
    });
}
