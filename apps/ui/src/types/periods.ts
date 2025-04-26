import type { UUID } from "crypto";

export type Period = {
  month: number;
  year: number;
};

export type PeriodActivityData = Period & {
  expense: number;
  revenue: number;
  investment: number;
  balance: number;
  categories: {
    category: UUID;
    value: number;
  }[];
};

export type PeriodAccountData = Period & {
  income: number;
  outcome: number;
  balance: number;
  accounts: {
    account: UUID;
    income: number;
    outcome: number;
    balance: number;
    cash: {
      in: number;
      out: number;
      balance: number;
    };
  }[];
};
