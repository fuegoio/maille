// Remove incorrect crypto import

export type Transaction = {
  id: string;
  amount: number;
  fromAccount: string;
  fromUser: string | null;
  toAccount: string;
  toUser: string | null;
};

export enum ActivityType {
  EXPENSE = "expense",
  REVENUE = "revenue",
  INVESTMENT = "investment",
  NEUTRAL = "neutral",
}

export type ActivityCategory = {
  id: string;
  name: string;
  type: ActivityType;
};

export type ActivitySubCategory = {
  id: string;
  name: string;
  category: string;
};

export type ActivityStatus = "scheduled" | "incomplete" | "completed";

export type ActivityMovement = {
  id: string;
  movement: string;
  amount: number;
};

export type Activity = {
  id: string;
  user: string;
  number: number;
  name: string;
  description: string | null;
  date: Date;
  type: ActivityType;
  category: string | null;
  subcategory: string | null;
  project: string | null;
  transactions: Transaction[];
  movements: ActivityMovement[];

  // Computed
  amount: number;
  status: ActivityStatus;
};

//
// Filters
//
export const ActivityFilterNameDescriptionOperators = [
  "contains",
  "does not contain",
  "is",
  "is not",
] as const;

export const ActivityFilterDateValues = [
  "today",
  "1 day ago",
  "2 days ago",
  "3 days ago",
  "1 week ago",
  "2 weeks ago",
  "3 weeks ago",
  "1 month ago",
  "2 months ago",
  "3 months ago",
  "6 months ago",
  "1 day from now",
  "2 days from now",
  "3 days from now",
  "1 week from now",
  "2 weeks from now",
  "3 weeks from now",
  "1 month from now",
  "2 months from now",
  "3 months from now",
  "6 months from now",
] as const;

export const ActivityFilterDateOperators = ["before", "after"] as const;

export const ActivityFilterAmountOperators = [
  "equal",
  "not equal",
  "greater",
  "less",
  "greater or equal",
  "less or equal",
] as const;

export const ActivityFilterMultipleOperators = ["is any of", "is not"] as const;

export const ActivityFilterCategoryOperators = ["is defined", "is not defined"] as const;

export const ActivityFilterFields: {
  value: ActivityFilter["field"];
  text: string;
  icon: string;
}[] = [
  { value: "name", text: "Name", icon: "mdi-alphabetical" },
  { value: "description", text: "Description", icon: "mdi-alphabetical" },
  { value: "date", text: "Date", icon: "mdi-calendar" },
  { value: "amount", text: "Amount", icon: "mdi-currency-eur" },
  { value: "type", text: "Type", icon: "mdi-plus-minus" },
  { value: "category", text: "Category", icon: "mdi-tag" },
  { value: "subcategory", text: "Subcategory", icon: "mdi-tag-outline" },
  {
    value: "from_account",
    text: "Source account",
    icon: "mdi-bank-transfer-out",
  },
  {
    value: "to_account",
    text: "Destination account",
    icon: "mdi-bank-transfer-in",
  },
];

export const OperatorsWithoutValue = ActivityFilterCategoryOperators;

type ActivityFilterNameDescription = {
  field: "name" | "description";
  operator?: (typeof ActivityFilterNameDescriptionOperators)[number];
  value?: string;
};

type ActivityFilterDate = {
  field: "date";
  operator?: (typeof ActivityFilterDateOperators)[number];
  value?: (typeof ActivityFilterDateValues)[number] | Date;
};

type ActivityFilterAmount = {
  field: "amount";
  operator?: (typeof ActivityFilterAmountOperators)[number];
  value?: number;
};

type ActivityFilterType = {
  field: "type";
  operator?: (typeof ActivityFilterMultipleOperators)[number];
  value?: ActivityType[];
};

type ActivityFilterCategory = {
  field: "category" | "subcategory";
  operator?:
    | (typeof ActivityFilterMultipleOperators)[number]
    | (typeof ActivityFilterCategoryOperators)[number];
  value?: string[];
};

type ActivityFilterAccount = {
  field: "from_account" | "to_account";
  operator?: (typeof ActivityFilterMultipleOperators)[number];
  value?: string[];
};

export type ActivityFilter =
  | ActivityFilterNameDescription
  | ActivityFilterDate
  | ActivityFilterAmount
  | ActivityFilterType
  | ActivityFilterCategory
  | ActivityFilterAccount;
