import type { Fund, FundMove } from "./types";

/**
 * Sum of moves leaving a fund (excluding internal balance-sheet flows).
 * fromFund = null means money entered from outside the tracked balance sheet.
 */
export const getFundOutflows = (fundId: string, fundMoves: FundMove[]): number =>
  fundMoves.filter((m) => m.fromFund === fundId).reduce((total, m) => total + m.amount, 0);

/**
 * Sum of moves entering a fund.
 * toFund = null means money left the tracked balance sheet entirely
 * (e.g. an expense consuming the fund) — still counts as an inflow of the
 * receiving side being null, i.e. the move is a draw-down of fromFund.
 */
export const getFundInflows = (fundId: string, fundMoves: FundMove[]): number =>
  fundMoves.filter((m) => m.toFund === fundId).reduce((total, m) => total + m.amount, 0);

export const getFundBalance = (fundId: string, fundMoves: FundMove[]): number =>
  getFundInflows(fundId, fundMoves) - getFundOutflows(fundId, fundMoves);

export const getFundsBalances = (funds: Fund[], fundMoves: FundMove[]) =>
  funds.map((fund) => ({
    fund,
    balance: getFundBalance(fund.id, fundMoves),
  }));

export const getTotalFundsBalance = (fundMoves: FundMove[]): number =>
  fundMoves.reduce(
    (total, m) => total + (m.toFund ? m.amount : 0) - (m.fromFund ? m.amount : 0),
    0,
  );
