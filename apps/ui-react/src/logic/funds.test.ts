import type { Fund, FundMove } from "@maille/core/funds";

import { describe, expect, it } from "vitest";

import {
  getFundChildren,
  getFundTreeBalance,
  getFundTreeFlowsBetweenDates,
  getFundsBalances,
} from "./funds";

const fund = (id: string, parentFund: string | null = null): Fund => ({
  id,
  name: id,
  color: "#818cf8",
  startDate: null,
  endDate: null,
  parentFund,
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
    const funds = [fund("liquid"), fund("house")];
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
    const funds = [fund("liquid")];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "liquid", amount: 100 }),
    ];

    const balances = getFundsBalances(funds, moves);
    expect(balances.find((b) => b.fund.id === "liquid")?.balance).toBe(100);
  });
});

describe("fund tree rollups (ui logic)", () => {
  const savings = fund("savings");
  const house = fund("house", "savings");
  const kitchen = fund("kitchen", "savings");
  const liquid = fund("liquid");

  it("a parent's rollup aggregates its whole subtree", () => {
    const funds = [savings, house, kitchen, liquid];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "savings", amount: 1000 }),
      move({ id: "2", fromFund: "savings", toFund: "house", amount: 300 }),
      move({ id: "3", fromFund: null, toFund: "kitchen", amount: 120 }),
    ];
    expect(getFundTreeBalance("savings", funds, moves)).toBe(1120);
    expect(getFundTreeBalance("house", funds, moves)).toBe(300);
    expect(getFundTreeBalance("kitchen", funds, moves)).toBe(120);
    expect(getFundTreeBalance("liquid", funds, moves)).toBe(0);
  });

  it("flows count only money crossing the subtree boundary", () => {
    const funds = [savings, house, kitchen];
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    const moves = [
      // Enters the savings tree from Untracked.
      move({
        id: "1",
        fromFund: null,
        toFund: "savings",
        amount: 1000,
        date: from,
      }),
      // Internal redistribution: neither in nor out for savings.
      move({
        id: "2",
        fromFund: "savings",
        toFund: "house",
        amount: 300,
        date: from,
      }),
      // Leaves the tree to Untracked: out.
      move({
        id: "3",
        fromFund: "kitchen",
        toFund: null,
        amount: 120,
        date: from,
      }),
      // Same window, outside it: ignored.
      move({
        id: "4",
        fromFund: null,
        toFund: "house",
        amount: 50,
        date: new Date("2026-03-01"),
      }),
    ];

    const flows = getFundTreeFlowsBetweenDates(
      "savings",
      funds,
      moves,
      from,
      to,
    );
    expect(flows.in).toBe(1000);
    expect(flows.out).toBe(120);

    // A leaf sees its own moves, matching the flat-fund behavior.
    const leafFlows = getFundTreeFlowsBetweenDates(
      "house",
      funds,
      moves,
      from,
      to,
    );
    expect(leafFlows.in).toBe(300);
  });

  it("children are name-sorted and direct only", () => {
    const funds = [savings, kitchen, house, liquid];
    expect(getFundChildren("savings", funds).map((f) => f.id)).toEqual([
      "house",
      "kitchen",
    ]);
    expect(getFundChildren("liquid", funds)).toEqual([]);
  });
});
