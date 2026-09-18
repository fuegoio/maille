import type { ViewDirection, ViewOption, ViewOrdering } from "@/types/views";

export const DATE_GROUPINGS: ViewOption[] = [
  { value: "none", text: "None" },
  { value: "day", text: "Day" },
  { value: "week", text: "Week" },
  { value: "period", text: "Month" },
  { value: "year", text: "Year" },
];

export type RowGroup = {
  key: string;
  label: string;
  shortLabel?: string;
  calendar?: boolean;
  sortValue?: number | string;
};

export type GroupAccessors<T> = Record<string, (row: T) => RowGroup>;

export type GroupedRow<T> =
  | (RowGroup & { itemType: "group"; id: string; rows: T[] })
  | ({ itemType: "row" } & T);

export function namedGroup(
  id: string | null | undefined,
  name: string | undefined,
  fallback: string,
): RowGroup {
  return { key: id ?? "none", label: name ?? fallback };
}

export function statusGroup(status: string): RowGroup {
  const labels: Record<string, string> = {
    scheduled: "Scheduled",
    incomplete: "Incomplete",
    completed: "Completed",
  };
  return {
    key: status,
    label: labels[status] ?? status,
    sortValue: ["scheduled", "incomplete", "completed"].indexOf(status),
  };
}

export function directionGroup(direction: "in" | "out" | "zero"): RowGroup {
  return {
    key: direction,
    label:
      direction === "in"
        ? "Inflow"
        : direction === "out"
          ? "Outflow"
          : "Zero amount",
  };
}

export function viewGroupOrder(
  grouping: string,
  ordering: ViewOrdering,
): ViewDirection {
  return DATE_GROUPINGS.some((option) => option.value === grouping)
    ? ordering.field === "date"
      ? ordering.direction
      : "desc"
    : "asc";
}

function dateGroup(date: Date, grouping: string): RowGroup {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (grouping === "week")
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (grouping === "period") start.setDate(1);
  if (grouping === "year") start.setMonth(0, 1);
  const options: Intl.DateTimeFormatOptions =
    grouping === "year"
      ? { year: "numeric" }
      : {
          day: grouping === "period" ? undefined : "numeric",
          month: "long",
          year: "numeric",
        };
  const prefix = grouping === "week" ? "Week of " : "";
  return {
    key: `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`,
    label: prefix + start.toLocaleDateString(undefined, options),
    shortLabel:
      prefix +
      start.toLocaleDateString(undefined, {
        ...options,
        month: grouping === "year" ? undefined : "short",
      }),
    calendar: true,
    sortValue: start.getTime(),
  };
}

/** Each row belongs to exactly one group, so group totals never double-count. */
export function groupViewRows<T extends { id: string; date: Date }>(
  rows: T[],
  grouping: string,
  accessors: GroupAccessors<T> = {},
  direction: ViewDirection = "desc",
  folded: readonly string[] = [],
): GroupedRow<T>[] {
  const temporal = DATE_GROUPINGS.some(
    (option) => option.value === grouping && grouping !== "none",
  );
  const accessor = temporal
    ? (row: T) => dateGroup(row.date, grouping)
    : accessors[grouping];
  if (!accessor || grouping === "none")
    return rows.map((row) => ({ ...row, itemType: "row" }));

  const groups = new Map<string, RowGroup & { id: string; rows: T[] }>();
  for (const row of rows) {
    const group = accessor(row);
    const id = `group:${grouping}:${group.key}`;
    const existing = groups.get(id);
    if (existing) existing.rows.push(row);
    else groups.set(id, { ...group, id, rows: [row] });
  }
  return [...groups.values()]
    .sort((a, b) => {
      const x = a.sortValue ?? a.label;
      const y = b.sortValue ?? b.label;
      const comparison =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y));
      return (
        (comparison || a.id.localeCompare(b.id)) *
        (direction === "asc" ? 1 : -1)
      );
    })
    .flatMap<GroupedRow<T>>((group) => [
      { ...group, itemType: "group" },
      ...(folded.includes(group.id)
        ? []
        : group.rows.map((row) => ({ ...row, itemType: "row" as const }))),
    ]);
}
