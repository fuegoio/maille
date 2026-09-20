import { ActivityType, type Activity } from "@maille/core/activities";

import type { ViewDescriptor } from "@/types/views";

import {
  DATE_GROUPINGS,
  emojiGroup,
  statusGroup,
  type GroupAccessors,
} from "@/lib/view-grouping";

export const ACTIVITY_AMOUNT_TYPES = [
  ActivityType.REVENUE,
  ActivityType.EXPENSE,
  ActivityType.INVESTMENT,
  ActivityType.ASSET,
  ActivityType.NEUTRAL,
] as const;
export const ACTIVITY_AMOUNT_FIELDS = ACTIVITY_AMOUNT_TYPES.map(
  (type) => `amount:${type}` as const,
);
const typeNames: Record<ActivityType, string> = {
  revenue: "Revenue",
  expense: "Expense",
  investment: "Investment",
  asset: "Asset",
  neutral: "Neutral",
};
export function visibleActivityAmountTypes(
  fields: readonly string[],
  /** A quick filter's type: every other type's amount stays hidden. */
  typeFilter?: ActivityType | null,
) {
  return ACTIVITY_AMOUNT_TYPES.filter(
    (type) =>
      fields.includes(`amount:${type}`) &&
      (typeFilter == null || type === typeFilter),
  );
}

/** The row fields of the activities view, in display order. */
export const ACTIVITY_VIEW_FIELDS = [
  "date",
  "status",
  "name",
  "category",
  "subcategory",
  "project",
  ...ACTIVITY_AMOUNT_FIELDS,
] as const;

export type ActivityViewField = (typeof ACTIVITY_VIEW_FIELDS)[number];

/** The grouping modes of the activities view. */
export const ACTIVITY_VIEW_GROUPINGS = [
  "none",
  "day",
  "week",
  "period",
  "year",
  "status",
  "category",
  "subcategory",
  "project",
  "type",
] as const;

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
  amounts: ACTIVITY_AMOUNT_TYPES.map((type) => ({
    value: `amount:${type}`,
    text: typeNames[type],
  })),
  orderings: [
    { value: "date", text: "Date" },
    { value: "name", text: "Name" },
    { value: "amount", text: "Amount" },
  ],
  groupings: [
    ...DATE_GROUPINGS,
    { value: "status", text: "Status" },
    { value: "category", text: "Category" },
    { value: "subcategory", text: "Subcategory" },
    { value: "project", text: "Project" },
    { value: "type", text: "Type" },
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

export function activityGroupAccessors(
  categories: { id: string; name: string; emoji?: string | null }[],
  subcategories: {
    id: string;
    name: string;
    category: string;
    emoji?: string | null;
  }[],
  projects: { id: string; name: string; emoji?: string | null }[],
): GroupAccessors<Activity> {
  return {
    status: (row) => statusGroup(row.status),
    category: (row) =>
      emojiGroup(
        row.category,
        categories.find((category) => category.id === row.category),
        "No category",
        "category",
      ),
    subcategory: (row) => {
      const subcategory = subcategories.find(
        (entry) => entry.id === row.subcategory,
      );
      const group = emojiGroup(
        row.subcategory,
        subcategory,
        "No subcategory",
        "subcategory",
      );
      if (!subcategory) return group;
      const category = categories.find(
        (entry) => entry.id === subcategory.category,
      );
      const parent = emojiGroup(
        subcategory.category,
        category,
        "Unknown category",
        "category",
      );
      return {
        ...group,
        parent: { label: parent.label, marker: parent.marker },
      };
    },
    project: (row) =>
      emojiGroup(
        row.project,
        projects.find((project) => project.id === row.project),
        "No project",
        "project",
      ),
    // Mixed activities form one type combination, not duplicate rows with duplicate totals.
    type: (row) => {
      const types = ACTIVITY_AMOUNT_TYPES.filter((type) =>
        row.types.includes(type),
      );
      return {
        key: types.join("+") || "none",
        marker: { kind: "types", values: types },
        label: types.map((type) => typeNames[type]).join(" + ") || "No type",
      };
    },
  };
}
