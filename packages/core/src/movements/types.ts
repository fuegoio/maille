import type { UUID } from "crypto";

import type {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "../activities/types.js";

export type MovementStatus = "incomplete" | "completed";

export type Movement = {
  id: UUID;
  date: Date;
  amount: number;
  account: UUID;
  name: string;
  activities: MovementActivity[];
  status: MovementStatus;
};

export type MovementActivity = {
  id: UUID;
  activity: UUID;
  amount: number;
};

export type MovementWithLink = Movement & {
  movementActivityId: UUID;
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
  icon: string;
}[] = [
  { value: "name", text: "Name", icon: "mdi-alphabetical" },
  { value: "date", text: "Date", icon: "mdi-calendar" },
  { value: "amount", text: "Amount", icon: "mdi-currency-eur" },
  { value: "account", text: "Account", icon: "mdi-bank" },
  { value: "status", text: "Status", icon: "mdi-check-circle" },
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
  value?: UUID[];
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
