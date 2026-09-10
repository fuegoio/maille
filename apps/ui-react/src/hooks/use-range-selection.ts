import * as React from "react";

/**
 * Shared multi-row selection for tables: a plain click toggles a row,
 * a shift-click selects every row between the anchor and the clicked row.
 *
 * `orderedIds` must match the rendered row order (skipping group headers
 * and non-selectable rows) so ranges follow what the user sees.
 */
export function useRangeSelection(orderedIds: string[]) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const anchorIdRef = React.useRef<string | null>(null);

  /** Toggle one row, or add the anchor-to-row range when shift is held. */
  const toggle = (id: string, event?: React.MouseEvent) => {
    if (event?.shiftKey && anchorIdRef.current !== null) {
      const anchorIndex = orderedIds.indexOf(anchorIdRef.current);
      const clickedIndex = orderedIds.indexOf(id);

      if (anchorIndex !== -1 && clickedIndex !== -1) {
        const [start, end] =
          anchorIndex < clickedIndex
            ? [anchorIndex, clickedIndex]
            : [clickedIndex, anchorIndex];
        const rangeIds = orderedIds.slice(start, end + 1);
        setSelectedIds((prev) =>
          Array.from(
            new Set([
              ...prev.filter((prevId) => !rangeIds.includes(prevId)),
              ...rangeIds,
            ]),
          ),
        );
        return;
      }
    }

    anchorIdRef.current = id;
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((prevId) => prevId !== id)
        : [...prev, id],
    );
  };

  /** Replace the selection with a single row (e.g. right-click). */
  const selectOnly = (id: string) => {
    anchorIdRef.current = id;
    setSelectedIds([id]);
  };

  const selectAll = (ids: string[]) => {
    anchorIdRef.current = null;
    setSelectedIds(ids);
  };

  const clear = () => {
    anchorIdRef.current = null;
    setSelectedIds([]);
  };

  return { selectedIds, toggle, selectOnly, selectAll, clear };
}
