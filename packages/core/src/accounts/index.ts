export enum AccountType {
  BANK_ACCOUNT = "bank_account",
  INVESTMENT_ACCOUNT = "investment_account",
  CASH = "cash",

  LIABILITIES = "liabilities",
  ASSETS = "assets",

  EXPENSE = "expense",
  REVENUE = "revenue",
}

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
