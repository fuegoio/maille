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

type AccountMovementEnabled = {
  movements: true;
  startingCashBalance: number | null;
};

type AccountMovementDisabled = {
  movements: false;
  startingCashBalance: null;
};

export type Account = (AccountMovementEnabled | AccountMovementDisabled) & {
  id: string;
  name: string;
  type: AccountType;
  default: boolean;
  startingBalance: number | null;
  user: string | null;
};
