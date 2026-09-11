export type FundMoveInput = {
  id: string;
  fromFund?: string | null;
  toFund?: string | null;
  amount: number;
  note?: string | null;
};

/**
 * A fund leg stored on its transaction: the transaction completes it, so
 * the leg carries no user or transaction reference — those live on the row.
 * The date is the activity's date, denormalized for direct consumption.
 */
export type TransactionFundMove = {
  id: string;
  fromFund: string | null;
  toFund: string | null;
  amount: number;
  date: string;
  note: string | null;
};
