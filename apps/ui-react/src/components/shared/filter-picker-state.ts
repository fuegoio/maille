export interface FilterShape {
  field: string;
  operator?: string;
  value?: unknown;
}

/** Zero is a valid amount; blank strings, empty lists and non-finite numbers are not values. */
export function isEmptyFilterValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (typeof value === "number" && !Number.isFinite(value)) ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Update the last filter for a field, preserving other constraints (including date ranges). */
export function replacePickerFilter<F extends FilterShape>(
  filters: F[],
  field: F["field"],
  next: F | null,
): F[] {
  let index = filters.length - 1;
  while (index >= 0 && filters[index].field !== field) index--;
  if (index === -1) return next === null ? filters : [...filters, next];
  if (next === null) return filters.filter((_, i) => i !== index);
  // API-backed views deserialize every update; object identity cannot identify a saved filter.
  if (JSON.stringify(filters[index]) === JSON.stringify(next)) return filters;
  return filters.map((filter, i) => (i === index ? next : filter));
}
