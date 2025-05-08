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
  amount: number;
  activity: UUID | null;
  account: UUID;
  name: string;
  date: dayjs.Dayjs;

  status: "incomplete" | "completed";
  linkId: UUID;
  linkedAmount?: number;
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
