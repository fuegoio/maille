import type { Fund, FundMove } from "./types";

/** Hex colors a fund icon can take, shared by the API default and the UI picker. */
export const FUND_COLORS = [
  "#818cf8", // indigo
  "#60a5fa", // blue
  "#38bdf8", // sky
  "#2dd4bf", // teal
  "#4ade80", // green
  "#a3e635", // lime
  "#fbbf24", // amber
  "#fb923c", // orange
  "#f87171", // red
  "#f472b6", // pink
  "#a78bfa", // violet
  "#e2a4e8" /* plum */,
] as const;

/** Color assigned to funds created without an explicit choice. */
export const DEFAULT_FUND_COLOR: string = FUND_COLORS[0];

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
