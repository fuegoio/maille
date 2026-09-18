import * as React from "react";

import type { ViewDirection } from "@/types/views";

import { groupViewRows, type GroupAccessors } from "@/lib/view-grouping";

/** Foldable groups shared by every ledger table. Group ids include the grouping mode. */
export function useGroupedRows<T extends { id: string; date: Date }>(
  rows: T[],
  grouping: string,
  accessors: GroupAccessors<T> = {},
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
  const items = React.useMemo(
    () => groupViewRows(rows, grouping, accessors, groupOrder, groupsFolded),
    [rows, grouping, accessors, groupOrder, groupsFolded],
  );
  return { items, isFolded, toggleGroup };
}
