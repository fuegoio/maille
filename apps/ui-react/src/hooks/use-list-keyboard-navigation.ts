import * as React from "react";

interface UseListKeyboardNavigationOptions<T> {
  items: T[];
  onSelect: (item: T) => void;
  /** Change this to reset the highlight (e.g. search or filter change). */
  resetKey: string;
}

/**
 * Arrow-key navigation for a list driven by a search input:
 * Up/Down move the highlight, Enter selects the highlighted item
 * (or the first one when nothing is highlighted).
 * The highlighted item is scrolled into view.
 */
export function useListKeyboardNavigation<T>({
  items,
  onSelect,
  resetKey,
}: UseListKeyboardNavigationOptions<T>) {
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [resetKey]);

  React.useEffect(() => {
    if (highlightedIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${highlightedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[highlightedIndex >= 0 ? highlightedIndex : 0];
      if (item) onSelect(item);
    }
  };

  return { highlightedIndex, listRef, handleKeyDown };
}
