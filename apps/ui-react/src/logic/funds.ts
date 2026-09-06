import type { Fund, FundMove } from "@maille/core/funds";

import { getFundBalance } from "@maille/core/funds";

export const getFundsBalances = (funds: Fund[], fundMoves: FundMove[]) =>
  funds.map((fund) => ({
    fund,
    balance: getFundBalance(fund.id, fundMoves),
  }));
