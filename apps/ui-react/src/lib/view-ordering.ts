import type { ViewOrdering } from "@/types/views";

type ViewOrderingAccessor<T> = (row: T) => number | string | Date;

function compareValues(
  a: number | string | Date,
  b: number | string | Date,
): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  return String(a).localeCompare(String(b));
}

/**
 * Sort rows under a view ordering: by the field's accessor (flipped when
 * descending), then newest first, then by id, so every ordering is
 * deterministic and stable. The accessors map the descriptor's ordering
 * fields (plus "date" and "id" for the secondary orders) to row values.
 */
export function sortViewRows<T>(
  rows: T[],
  ordering: ViewOrdering,
  accessors: Record<string, ViewOrderingAccessor<T>>,
): T[] {
  return [...rows].sort((a, b) => {
    let comparison = 0;

    const primary = accessors[ordering.field];
    if (primary !== undefined) {
      comparison = compareValues(primary(a), primary(b));
      if (ordering.direction === "desc") {
        comparison = -comparison;
      }
    }

    if (comparison === 0 && accessors.date !== undefined) {
      comparison = -compareValues(accessors.date(a), accessors.date(b));
    }
    if (comparison === 0 && accessors.id !== undefined) {
      comparison = -compareValues(accessors.id(a), accessors.id(b));
    }

    return comparison;
  });
}
