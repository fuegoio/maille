import { describe, expect, it } from "vitest";

import type { Fund, FundMove } from "@maille/core/funds";

import {
  flattenFundTree,
  getFundAncestors,
  getFundBalance,
  getFundDescendants,
  getFundTreeBalance,
  getFundsBalances,
  getTotalFundsBalance,
  wouldCreateCycle,
} from "@maille/core/funds";

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

describe("fund trees", () => {
  const savings = fund("savings");
  const house = fund("house", "savings");
  const kitchen = fund("kitchen", "house");
  const liquid = fund("liquid");

  it("collects descendants at every depth", () => {
    const funds = [savings, house, kitchen, liquid];
    expect(getFundDescendants("savings", funds)).toEqual(new Set(["house", "kitchen"]));
    expect(getFundDescendants("house", funds)).toEqual(new Set(["kitchen"]));
    expect(getFundDescendants("kitchen", funds)).toEqual(new Set());
    expect(getFundDescendants("liquid", funds)).toEqual(new Set());
  });

  it("flags reparenting under self or a descendant as a cycle", () => {
    const funds = [savings, house, kitchen];
    expect(wouldCreateCycle("house", "house", funds)).toBe(true);
    expect(wouldCreateCycle("savings", "kitchen", funds)).toBe(true);
    expect(wouldCreateCycle("kitchen", "savings", funds)).toBe(false);
    expect(wouldCreateCycle("house", null, funds)).toBe(false);
  });

  it("tree balance counts moves crossing the subtree boundary once", () => {
    const funds = [savings, house, kitchen, liquid];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "savings", amount: 1000 }),
      move({ id: "2", fromFund: "savings", toFund: "house", amount: 300 }),
      move({ id: "3", fromFund: "house", toFund: "kitchen", amount: 100 }),
    ];
    expect(getFundTreeBalance("savings", funds, moves.slice(0, 3))).toBe(1000);
    expect(getFundTreeBalance("house", funds, moves.slice(0, 3))).toBe(300);
    expect(getFundTreeBalance("kitchen", funds, moves.slice(0, 3))).toBe(100);
    // A move leaving the subtree deducts once, at whichever depth it exits.
    const exiting = [
      ...moves.slice(0, 3),
      move({ id: "4", fromFund: "kitchen", toFund: "liquid", amount: 50 }),
    ];
    expect(getFundTreeBalance("savings", funds, exiting)).toBe(950);
    expect(getFundTreeBalance("kitchen", funds, exiting)).toBe(50);
    expect(getFundTreeBalance("liquid", funds, exiting)).toBe(50);
  });

  it("moves between a parent and its child leave the subtree total unchanged", () => {
    const funds = [savings, house];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "savings", amount: 1000 }),
      move({ id: "2", fromFund: "savings", toFund: "house", amount: 300 }),
    ];
    expect(getFundTreeBalance("savings", funds, moves)).toBe(1000);
    expect(getFundBalance("house", moves)).toBe(300);
  });

  it("flattens the forest depth-first with sorted names and depths", () => {
    const funds = [kitchen, house, liquid, savings];
    const nodes = flattenFundTree(funds);
    expect(nodes.map((n) => [n.fund.id, n.depth, n.hasChildren])).toEqual([
      ["liquid", 0, false],
      ["savings", 0, true],
      ["house", 1, true],
      ["kitchen", 2, false],
    ]);
  });

  it("keeps funds with a dangling parent visible as roots", () => {
    const orphan = fund("orphan", "ghost");
    const nodes = flattenFundTree([liquid, orphan]);
    expect(nodes.map((n) => n.fund.id)).toEqual(["liquid", "orphan"]);
  });

  it("walks the ancestor chain from root to parent", () => {
    const funds = [savings, house, kitchen, liquid];
    expect(getFundAncestors("kitchen", funds).map((f) => f.id)).toEqual(["savings", "house"]);
    expect(getFundAncestors("savings", funds)).toEqual([]);
    expect(getFundAncestors("liquid", funds)).toEqual([]);
  });
});
