export type Fund = {
  id: string;
  name: string;
  color: string;
  startDate: Date | null;
  endDate: Date | null;
  /** Parent fund; null is a root. Parent chains must never form a cycle. */
  parentFund: string | null;
  /** Opening accounts: how much of each balance account belongs to this fund at its start. */
  accounts: FundAccount[];
};

export type FundMove = {
  id: string;
  fromFund: string | null;
  toFund: string | null;
  amount: number;
  date: Date;
  note: string | null;
  // Staged moves in the UI carry null until their transaction is saved; rows
  // read back from the server always reference one.
  transaction: string | null;
};

/**
 * A fund's opening entry: at the fund's start date, this much of the
 * account's balance belongs to the fund. The date is not stored — it is
 * derived from the fund (start date, falling back to the user's starting
 * date), so editing a fund's start date re-dates its accounts.
 *
 * The `fund` field is redundant with the parent `Fund.accounts` array but
 * kept so the positions engine and balance logic can work with a flat list.
 */
export type FundAccount = {
  id: string;
  fund: string;
  account: string;
  amount: number;
};
