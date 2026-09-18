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

/** Both the add menu and saved chips keep unfinished edits local. */
export function resolveFilterUpdate<F extends FilterShape>(
  pending: F,
  patch: Partial<F>,
  operatorsWithoutValue: readonly string[] = [],
): { pending: F; saved: F | null | undefined } {
  const next = { ...pending, ...patch };
  if (next.operator && operatorsWithoutValue.includes(next.operator)) {
    const complete = { ...next, value: undefined };
    return { pending: complete, saved: complete };
  }
  if (next.operator && !isEmptyFilterValue(next.value)) {
    return { pending: next, saved: next };
  }
  return {
    pending: next,
    saved:
      "value" in patch && isEmptyFilterValue(next.value) ? null : undefined,
  };
}

export function toggleFilterValue(current: unknown, value: string): string[] {
  const values: string[] = Array.isArray(current) ? current : [];
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
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
