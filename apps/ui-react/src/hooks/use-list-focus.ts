import * as React from "react";

/**
 * Vim-style row focus for tables: J/K move a focused (highlighted but not
 * checked) row through the list in rendered order, and the table opens the
 * focused row on Enter. The hook only tracks which row is focused and keeps
 * it scrolled into view; navigation stays with the table.
 *
 * `orderedIds` must match the rendered row order (skipping group headers
 * and non-selectable rows) — the same contract as `useRangeSelection`.
 */
export function useListFocus(orderedIds: string[]) {
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const rowRefs = React.useRef(new Map<string, HTMLElement>());
  const registerRowCallbacks = React.useRef(
    new Map<string, (element: HTMLElement | null) => void>(),
  );

  /** Ref callback for a row element, stable across renders for a given id. */
  const registerRow = React.useCallback((id: string) => {
    let callback = registerRowCallbacks.current.get(id);
    if (!callback) {
      callback = (element: HTMLElement | null) => {
        if (element) {
          rowRefs.current.set(id, element);
        } else {
          rowRefs.current.delete(id);
        }
      };
      registerRowCallbacks.current.set(id, callback);
    }
    return callback;
  }, []);

  // Drop the focus when the focused row disappears (filtered out, deleted)
  React.useEffect(() => {
    setFocusedId((prev) =>
      prev !== null && !orderedIds.includes(prev) ? null : prev,
    );
  }, [orderedIds]);

  // Keep the focused row visible as focus moves
  React.useEffect(() => {
    if (focusedId === null) return;
    rowRefs.current.get(focusedId)?.scrollIntoView({ block: "nearest" });
  }, [focusedId]);

  /**
   * Move focus by `delta` rows, clamped to the list bounds. When nothing
   * is focused, focus the first row.
   */
  const moveFocus = React.useCallback(
    (delta: number) => {
      if (orderedIds.length === 0) return;

      setFocusedId((prev) => {
        const currentIndex = prev === null ? -1 : orderedIds.indexOf(prev);
        const nextIndex = Math.min(
          Math.max(currentIndex + delta, 0),
          orderedIds.length - 1,
        );
        return orderedIds[nextIndex] ?? null;
      });
    },
    [orderedIds],
  );

  const clearFocus = React.useCallback(() => setFocusedId(null), []);

  return { focusedId, registerRow, moveFocus, clearFocus };
}
