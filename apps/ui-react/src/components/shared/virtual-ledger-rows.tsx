import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

import type { GroupedRow } from "@/lib/view-grouping";

interface VirtualLedgerRowsProps<T> {
  /**
   * Every rendered item in order, group headers included; only the items
   * in view (plus overscan) are mounted.
   */
  items: GroupedRow<T>[];
  /** The scroll container: the ScrollArea viewport the table restores. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /**
   * The keyboard-focused row (J/K). When it moves outside the rendered
   * window the list scrolls it into view, matching scrollIntoView on
   * mounted rows.
   */
  focusedId?: string | null;
  renderItem: (item: GroupedRow<T>) => React.ReactNode;
}

const GROUP_HEADER_HEIGHT = 36;
const ROW_HEIGHT = 40;

/**
 * The virtualized body shared by every ledger table: a tall relative
 * container with absolutely positioned, measured rows, so tables with
 * thousands of rows only mount what is visible.
 */
export function VirtualLedgerRows<T extends { id: string; date: Date }>({
  items,
  scrollRef,
  focusedId,
  renderItem,
}: VirtualLedgerRowsProps<T>) {
  // The scroll viewport is an ancestor of this list, so its ref is only
  // attached after this component's layout effects: resolve it from a
  // passive effect, then re-render with the element in hand.
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null);
  React.useEffect(() => {
    setScrollElement(scrollRef.current);
  }, [scrollRef]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) =>
      items[index].itemType === "group" ? GROUP_HEADER_HEIGHT : ROW_HEIGHT,
    getItemKey: (index) => items[index].id,
    overscan: 12,
  });

  // The focused row is unmounted when J/K moves it out of the rendered
  // window; scroll it back in the same way useListFocus does for
  // mounted rows.
  React.useEffect(() => {
    if (focusedId == null) return;
    const index = items.findIndex((item) => item.id === focusedId);
    if (index === -1) return;
    const virtualItems = virtualizer.getVirtualItems();
    if (
      virtualItems.length !== 0 &&
      (index < virtualItems[0].index ||
        index > virtualItems[virtualItems.length - 1].index)
    ) {
      virtualizer.scrollToIndex(index, { align: "auto" });
    }
  }, [focusedId, items, virtualizer]);

  return (
    <div
      style={{ height: virtualizer.getTotalSize(), position: "relative" }}
      className="w-full"
    >
      {virtualizer.getVirtualItems().map((virtualRow) => (
        <div
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={virtualizer.measureElement}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {renderItem(items[virtualRow.index])}
        </div>
      ))}
    </div>
  );
}
