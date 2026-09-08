import { describe, expect, it } from "vitest";

import type { Fund, FundMove } from "@maille/core/funds";

import { getFundBalance, getFundsBalances, getTotalFundsBalance } from "@maille/core/funds";

const fund = (id: string): Fund => ({
  id,
  name: id,
  color: "#818cf8",
  startDate: null,
  endDate: null,
});

const move = (partial: Partial<FundMove> & Pick<FundMove, "id">): FundMove => ({
  fromFund: null,
  toFund: null,
  amount: 0,
  date: new Date("2026-01-01"),
  note: null,
  transaction: null,
  ...partial,
});

describe("fund balances", () => {
  it("computes balance from inflows and outflows", () => {
    const moves = [
      move({ id: "1", fromFund: null, toFund: "liquid", amount: 1000 }),
      move({ id: "2", fromFund: "liquid", toFund: "house", amount: 300 }),
    ];
    expect(getFundBalance("liquid", moves)).toBe(700);
    expect(getFundBalance("house", moves)).toBe(300);
  });

  it("treats money leaving to null as a draw-down of the source fund", () => {
    const moves = [
      move({ id: "1", fromFund: null, toFund: "house", amount: 30000 }),
      move({ id: "2", fromFund: "house", toFund: null, amount: 450, transaction: "t1" }),
    ];
    expect(getFundBalance("house", moves)).toBe(29550);
  });

  it("computes balances for all funds", () => {
    const funds = [fund("liquid"), fund("house")];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "liquid", amount: 500 }),
      move({ id: "2", fromFund: "liquid", toFund: "house", amount: 200 }),
    ];
    const balances = getFundsBalances(funds, moves);
    expect(balances.find((b) => b.fund.id === "liquid")?.balance).toBe(300);
    expect(balances.find((b) => b.fund.id === "house")?.balance).toBe(200);
  });

  it("total balance counts only moves that cross the fund system boundary on one side", () => {
    const moves = [
      move({ id: "1", fromFund: null, toFund: "liquid", amount: 5000 }),
      move({ id: "2", fromFund: "liquid", toFund: "house", amount: 2000 }),
      move({ id: "3", fromFund: "house", toFund: null, amount: 100, transaction: "t1" }),
    ];
    expect(getTotalFundsBalance(moves)).toBe(4900);
  });

  it("internal moves between funds do not change the total", () => {
    const moves = [
      move({ id: "1", fromFund: null, toFund: "liquid", amount: 5000 }),
      move({ id: "2", fromFund: "liquid", toFund: "house", amount: 2000 }),
      move({ id: "3", fromFund: "house", toFund: "liquid", amount: 1500 }),
    ];
    expect(getTotalFundsBalance(moves)).toBe(5000);
  });

  it("returns 0 for a fund without moves", () => {
    expect(getFundBalance("empty", [])).toBe(0);
  });
});
