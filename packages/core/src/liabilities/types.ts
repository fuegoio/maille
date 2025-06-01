import type {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityFilterMultipleOperators,
  ActivityFilterNameDescriptionOperators,
} from "#activities/types.ts";
import type { UUID } from "crypto";
import type dayjs from "dayjs";

export type Liability = {
  id: UUID;
  amount: number;
  activity: UUID | null;
  account: UUID;
  name: string;
  date: dayjs.Dayjs;
};

type LiabilityFilterNameDescription = {
  field: "name" | "description";
  operator?: (typeof ActivityFilterNameDescriptionOperators)[number];
  value?: string;
};

type LiabilityFilterDate = {
  field: "date";
  operator?: (typeof ActivityFilterDateOperators)[number];
  value?: (typeof ActivityFilterDateValues)[number] | dayjs.Dayjs;
};

type LiabilityFilterAmount = {
  field: "amount";
  operator?: (typeof ActivityFilterAmountOperators)[number];
  value?: number;
};

type LiabilityFilterAccount = {
  field: "account";
  operator?: (typeof ActivityFilterMultipleOperators)[number];
  value?: UUID[];
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
