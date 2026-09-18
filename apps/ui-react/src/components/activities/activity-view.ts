import type { Activity } from "@maille/core/activities";

import type { ViewDescriptor } from "@/types/views";

/** The row fields of the activities view, in display order. */
export const ACTIVITY_VIEW_FIELDS = [
  "date",
  "status",
  "name",
  "category",
  "subcategory",
  "project",
] as const;

export type ActivityViewField = (typeof ACTIVITY_VIEW_FIELDS)[number];

/** The grouping modes of the activities view. */
export const ACTIVITY_VIEW_GROUPINGS = ["none", "period"] as const;

export type ActivityViewGrouping = (typeof ACTIVITY_VIEW_GROUPINGS)[number];

/**
 * What the activities view offers to view configuration. Any resource
 * table gets the settings popover by declaring a descriptor like this
 * one; the generic sections render from it.
 */
export const activityViewDescriptor: ViewDescriptor = {
  fields: [
    { value: "date", text: "Date" },
    { value: "status", text: "Status" },
    { value: "name", text: "Name", locked: true },
    { value: "category", text: "Category" },
    { value: "subcategory", text: "Subcategory" },
    { value: "project", text: "Project" },
  ],
  orderings: [
    { value: "date", text: "Date" },
    { value: "name", text: "Name" },
    { value: "amount", text: "Amount" },
  ],
  groupings: [
    { value: "none", text: "None" },
    { value: "period", text: "Month" },
  ],
};

/** Field accessors used to order activity rows under a view. */
export const activityOrderingAccessors: Record<
  string,
  (activity: Activity) => number | string | Date
> = {
  id: (activity) => activity.id,
  date: (activity) => activity.date,
  name: (activity) => activity.name,
  amount: (activity) => activity.amount,
};
