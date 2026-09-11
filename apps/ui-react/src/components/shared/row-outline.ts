/**
 * Unified row treatment for tables: a 1px primary outline plus a quiet
 * primary tint, identical whether the row is checked or keyboard-focused.
 *
 * Contiguous selected rows merge into one outlined block: the top edge is
 * omitted when the previous rendered row is also selected, the bottom edge
 * when the next one is, and the row's own divider (`border-b`) is hidden
 * while selected so junctions have no duplicate lines. Group headers and
 * unselectable rows act as breaks and split runs.
 *
 * The outline is a `::after` overlay confined to the row's border box:
 * flush horizontally (`inset-x-0`) and vertically at the top (`top-0`), with
 * the bottom inset compensated for the row's own 1px divider (`-bottom-px`)
 * so it reaches the last pixel of the border box. Nothing overhangs the row,
 * so no edge is ever clipped by a scroll viewport, and each row covers its
 * own divider strip — merged runs show a single tint layer at junctions.
 * The overlay is layered below the row's content (negative z) so text
 * stays untinted.
 */
export type OutlineRow =
  /** A selectable row in rendered order. */
  | { id: string; selected: boolean }
  /** A visual break: group header or unselectable row. */
  | "break";

/**
 * Outline sides for every selected row, given the rendered row sequence
 * (breaks included). A row only appears in the result when selected.
 */
export function computeRowOutlines(rows: OutlineRow[]) {
  const outlines = new Map<string, { top: boolean; bottom: boolean }>();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (row === "break" || !row.selected) continue;

    const previous = rows[index - 1];
    const next = rows[index + 1];
    const previousSelected =
      previous !== undefined && previous !== "break" && previous.selected;
    const nextSelected =
      next !== undefined && next !== "break" && next.selected;

    outlines.set(row.id, { top: !previousSelected, bottom: !nextSelected });
  }

  return outlines;
}

const SIDES = {
  both: "after:border after:border-primary",
  topOnly: "after:border after:border-primary after:border-b-0",
  bottomOnly: "after:border after:border-primary after:border-t-0",
  none: "after:border after:border-primary after:border-y-0",
} as const;

/** Classes for a selected row; `sides` comes from `computeRowOutlines`. */
export function rowOutlineClasses(sides: { top: boolean; bottom: boolean }) {
  return [
    // `isolate` makes the row its own stacking context: without it the
    // negative-z overlay escapes behind the opaque page background.
    "relative isolate border-b-transparent hover:bg-transparent",
    "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:-bottom-px after:-z-10 after:content-['']",
    "after:bg-primary/10 hover:after:bg-primary/15 after:transition-colors after:duration-100",
    sides.top && sides.bottom
      ? SIDES.both
      : sides.top
        ? SIDES.topOnly
        : sides.bottom
          ? SIDES.bottomOnly
          : SIDES.none,
  ].join(" ");
}
