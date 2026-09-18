import * as React from "react";

import type { ViewDirection } from "@/types/views";

/** A month-period group header followed by its rows, in rendered order. */
export type GroupedRow<T> =
  | {
      itemType: "group";
      id: string;
      month: number;
      year: number;
      rows: T[];
    }
  | ({ itemType: "row" } & T);

/**
 * Month-period grouping for tables: rows are grouped by their date's
 * month and year, each group preceded by a foldable header, the groups
 * ordered by the direction (newest first by default). Without grouping
 * the rows pass through untouched.
 */
export function useGroupedRows<T extends { id: string; date: Date }>(
  rows: T[],
  grouping: boolean,
  groupOrder: ViewDirection = "desc",
) {
  const [groupsFolded, setGroupsFolded] = React.useState<string[]>([]);

  const isFolded = React.useCallback(
    (id: string) => groupsFolded.includes(id),
    [groupsFolded],
  );

  const toggleGroup = React.useCallback((id: string) => {
    setGroupsFolded((prev) =>
      prev.includes(id) ? prev.filter((group) => group !== id) : [...prev, id],
    );
  }, []);

  const items = React.useMemo<GroupedRow<T>[]>(() => {
    if (!grouping) {
      return rows.map((row) => ({ itemType: "row" as const, ...row }));
    }

    const groups = rows.reduce(
      (groups, row) => {
        const month = row.date.getMonth();
        const year = row.date.getFullYear();
        const group = groups.find((p) => p.month === month && p.year === year);

        if (group) {
          group.rows.push(row);
        } else {
          groups.push({
            id: `${month}-${year}`,
            month,
            year,
            rows: [row],
          });
        }

        return groups;
      },
      [] as { id: string; month: number; year: number; rows: T[] }[],
    );

    return groups
      .sort((a, b) => {
        const sign = groupOrder === "asc" ? -1 : 1;
        if (a.year !== b.year) return (b.year - a.year) * sign;
        return (b.month - a.month) * sign;
      })
      .reduce((items: GroupedRow<T>[], group) => {
        items.push({ itemType: "group", ...group });
        if (groupsFolded.includes(group.id)) {
          return items;
        }
        return items.concat(
          group.rows.map((row) => ({ itemType: "row" as const, ...row })),
        );
      }, []);
  }, [rows, grouping, groupOrder, groupsFolded]);

  return { items, isFolded, toggleGroup };
}
