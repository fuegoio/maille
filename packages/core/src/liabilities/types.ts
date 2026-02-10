import type {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "#activities/types.ts";

export type Liability = {
  id: string;
  amount: number;
  activity: string | null;
  account: string;
  name: string;
  date: Date;
};

type LiabilityFilterNameDescription = {
  field: "name" | "description";
  operator?: (typeof ActivityFilterNameDescriptionOperators)[number];
  value?: string;
};

type LiabilityFilterDate = {
  field: "date";
  operator?: (typeof ActivityFilterDateOperators)[number];
  value?: (typeof ActivityFilterDateValues)[number] | Date;
};

type LiabilityFilterAmount = {
  field: "amount";
  operator?: (typeof ActivityFilterAmountOperators)[number];
  value?: number;
};

type LiabilityFilterAccount = {
  field: "account";
  operator?: (typeof ActivityFilterMultipleOperators)[number];
  value?: string[];
};

export type LiabilityFilter =
  | LiabilityFilterNameDescription
  | LiabilityFilterDate
  | LiabilityFilterAmount
  | LiabilityFilterAccount;

export const LiabilityFilterFields: {
  value: LiabilityFilter["field"];
  text: string;
  icon: string;
}[] = [
  { value: "name", text: "Name", icon: "mdi-alphabetical" },
  { value: "date", text: "Date", icon: "mdi-calendar" },
  { value: "amount", text: "Amount", icon: "mdi-currency-eur" },
  { value: "account", text: "Account", icon: "mdi-bank" },
];
