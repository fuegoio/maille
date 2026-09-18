/** Sort direction of a view's rows. */
export type ViewDirection = "asc" | "desc";

/** How the rows of a view are ordered. */
export type ViewOrdering = {
  field: string;
  direction: ViewDirection;
};

/**
 * The resource-agnostic configuration every row kind shares: which fields
 * each row shows, how rows are ordered and how they are grouped. A
 * resource's view type extends it with its own options and filters.
 */
export type ViewConfig = {
  /** Visible field ids, in display order. */
  fields: string[];
  ordering: ViewOrdering;
  grouping: string;
};

export type ViewOption = {
  value: string;
  text: string;
  /** Locked fields are always visible; they anchor the row. */
  locked?: boolean;
};

/**
 * What a row kind (activity, movement, fund move, ...) offers to view
 * configuration. Declaring a descriptor is all a resource needs to get
 * the generic settings popover.
 */
export type ViewDescriptor = {
  /** Toggleable row fields, in display order. */
  fields: ViewOption[];
  /** Fields the rows can be ordered by. */
  orderings: ViewOption[];
  /** Grouping modes; conventionally starts with "none". */
  groupings: ViewOption[];
};
