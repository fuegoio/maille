export type Fund = {
  id: string;
  name: string;
  color: string;
  startDate: Date | null;
  endDate: Date | null;
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
