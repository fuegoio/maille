export type FundMoveInput = {
  id: string;
  fromFund?: string | null;
  toFund?: string | null;
  amount: number;
  note?: string | null;
};
