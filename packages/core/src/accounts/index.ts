export * from "./assets.ts";
export * from "./counterparties.ts";

export enum AccountType {
  BANK_ACCOUNT = "bank_account",
  INVESTMENT_ACCOUNT = "investment_account",
  CASH = "cash",

  LIABILITIES = "liabilities",
  ASSETS = "assets",

  EXPENSE = "expense",
  REVENUE = "revenue",
}

export const ACCOUNT_TYPES = [
  AccountType.BANK_ACCOUNT,
  AccountType.INVESTMENT_ACCOUNT,
  AccountType.ASSETS,
  AccountType.CASH,
  AccountType.LIABILITIES,
  AccountType.EXPENSE,
  AccountType.REVENUE,
];

export const isAccountType = (value: string): value is AccountType => {
  return Object.values(AccountType).includes(value as AccountType);
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  default: boolean;
  startingBalance: number | null;
  startingCashBalance: number | null;
  movements: boolean;
  user: string | null;
};
