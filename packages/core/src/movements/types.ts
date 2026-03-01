import type {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "../activities/types";

export type MovementStatus = "incomplete" | "completed";

export type Movement = {
  id: string;
  date: Date;
  amount: number;
  account: string;
  name: string;
  activities: MovementActivity[];
  status: MovementStatus;
};

export type MovementActivity = {
  id: string;
  activity: string;
  amount: number;
};

export type MovementWithLink = Movement & {
  movementActivityId: string;
  amountLinked: number;
};

//
// Filters
//
export const MovementFilterStatusOperators = ["is defined", "is not defined"] as const;

export const OperatorsWithoutValue = MovementFilterStatusOperators;

export const MovementFilterFields: {
  value: MovementFilter["field"];
  text: string;
}[] = [
  { value: "name", text: "Name" },
  { value: "date", text: "Date" },
  { value: "amount", text: "Amount" },
  { value: "account", text: "Account" },
  { value: "status", text: "Status" },
];

type MovementFilterName = {
  field: "name";
  operator?: (typeof ActivityFilterNameDescriptionOperators)[number];
  value?: string;
};

type MovementFilterDate = {
  field: "date";
  operator?: (typeof ActivityFilterDateOperators)[number];
  value?: (typeof ActivityFilterDateValues)[number] | Date;
};

type MovementFilterAmount = {
  field: "amount";
  operator?: (typeof ActivityFilterAmountOperators)[number];
  value?: number;
};

type MovementFilterAccount = {
  field: "account";
  operator?: (typeof ActivityFilterMultipleOperators)[number];
  value?: string[];
};

type MovementFilterStatus = {
  field: "status";
  operator?: (typeof ActivityFilterMultipleOperators)[number];
  value?: ("incomplete" | "completed")[];
};

export type MovementFilter =
  | MovementFilterName
  | MovementFilterDate
  | MovementFilterAmount
  | MovementFilterAccount
  | MovementFilterStatus;
