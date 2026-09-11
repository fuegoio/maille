import { useHotkey } from "@tanstack/react-hotkeys";
import * as React from "react";

import {
  computeRowOutlines,
  type OutlineRow,
} from "@/components/shared/row-outline";
import { useListFocus } from "@/hooks/use-list-focus";
import { useRangeSelection } from "@/hooks/use-range-selection";

/**
 * A rendered table row. Selectable rows take part in focus, selection
 * and outlines; every other row (group header, unselectable row) breaks
 * outlined runs.
 */
export interface TableRow {
  id: string;
  selectable?: boolean;
}

interface UseTableRowsOptions {
  /** Every rendered row in order, headers and unselectable rows included. */
  rows: TableRow[];
  /** Opens the focused row on Enter. */
  onOpen: (id: string) => void;
  /**
   * Rows carry a checkbox: Space toggles the focused row, Mod+A selects
   * every rendered row, Escape clears the selection before the focus.
   */
  checkable?: boolean;
  /** Rows the table marks selected on its own (e.g. an open side panel). */
  forcedSelectedIds?: string[];
}

/**
 * The shared table framework: keyboard focus, row selection and row
 * outlines in one place, so every table behaves the same.
 *
 * - J/K move the focused row through the rendered order (K up, J down,
 *   first row when nothing is focused) and keep it scrolled into view.
 * - Enter opens the focused row, Escape clears the selection and then
 *   the focus.
 * - On checkable tables, Space toggles the focused row's checkbox and
 *   Mod+A selects every rendered row.
 * - Checked and focused rows get the same primary outline; contiguous
 *   selected rows merge into one outlined block.
 */
export function useTableRows({
  rows,
  onOpen,
  checkable = false,
  forcedSelectedIds,
}: UseTableRowsOptions) {
  // Selectable rows in rendered order, the contract shared by focus and
  // range selection
  const orderedIds = React.useMemo(
    () => rows.flatMap((row) => (row.selectable === false ? [] : [row.id])),
    [rows],
  );

  const { focusedId, registerRow, moveFocus, clearFocus } =
    useListFocus(orderedIds);

  const {
    selectedIds,
    toggle,
    selectOnly,
    selectAll,
    clear: clearSelection,
  } = useRangeSelection(orderedIds);

  // Outline sides for selected (checked, forced or focused) rows;
  // contiguous selected rows merge into one outlined block
  const rowOutlines = React.useMemo(() => {
    const forced = new Set(forcedSelectedIds);
    const outlineRows: OutlineRow[] = rows.map((row) =>
      row.selectable === false
        ? ("break" as const)
        : {
            id: row.id,
            selected:
              (checkable && selectedIds.includes(row.id)) ||
              forced.has(row.id) ||
              row.id === focusedId,
          },
    );
    return computeRowOutlines(outlineRows);
  }, [rows, checkable, selectedIds, forcedSelectedIds, focusedId]);

  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    moveFocus(-1);
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    moveFocus(1);
  });

  useHotkey(
    "Enter",
    () => {
      if (focusedId !== null) {
        onOpen(focusedId);
      }
    },
    { ignoreInputs: true },
  );

  useHotkey(
    "Space",
    () => {
      if (focusedId !== null) {
        toggle(focusedId);
      }
    },
    { ignoreInputs: true, enabled: checkable },
  );

  useHotkey(
    "Escape",
    () => {
      if (checkable && selectedIds.length > 0) {
        clearSelection();
      } else {
        clearFocus();
      }
    },
    { conflictBehavior: "allow" },
  );

  useHotkey(
    "Mod+A",
    (event) => {
      if (event.key !== "a") return;
      selectAll(orderedIds);
    },
    { ignoreInputs: true, enabled: checkable },
  );

  return {
    focusedId,
    registerRow,
    rowOutlines,
    selectedIds,
    toggle,
    selectOnly,
    selectAll,
    clearSelection,
  };
}
