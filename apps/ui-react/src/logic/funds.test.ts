import type { Fund, FundMove } from "@maille/core/funds";

import { describe, expect, it } from "vitest";

import { getFundsBalances } from "./funds";

const fund = (id: string, isDefault = false): Fund => ({
  id,
  name: id,
  emoji: null,
  isDefault,
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

describe("funds balances (ui logic)", () => {
  it("derives balances from standalone allocations and transaction-linked draw-downs", () => {
    const funds = [fund("liquid", true), fund("house")];
    const moves = [
      // Allocate 30000 to house work
      move({ id: "1", fromFund: "liquid", toFund: "house", amount: 30000 }),
      // Buy paint: 450 leaves the house fund via a transaction leg
      move({
        id: "2",
        fromFund: "house",
        toFund: null,
        amount: 450,
        transaction: "tx-1",
      }),
    ];

    const balances = getFundsBalances(funds, moves);
    expect(balances.find((b) => b.fund.id === "house")?.balance).toBe(29550);
    expect(balances.find((b) => b.fund.id === "liquid")?.balance).toBe(-30000);
  });

  it("is unaffected by moves of deleted funds (cascade cleanup)", () => {
    const funds = [fund("liquid", true)];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "liquid", amount: 100 }),
    ];

    const balances = getFundsBalances(funds, moves);
    expect(balances.find((b) => b.fund.id === "liquid")?.balance).toBe(100);
  });
});
