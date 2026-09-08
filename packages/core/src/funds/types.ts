export type Fund = {
  id: string;
  name: string;
  color: string;
  startDate: Date | null;
  endDate: Date | null;
  /** Parent fund; null is a root. Parent chains must never form a cycle. */
  parentFund: string | null;
};

export type FundMove = {
  id: string;
  fromFund: string | null;
  toFund: string | null;
  amount: number;
  date: Date;
  note: string | null;
  transaction: string | null;
};
