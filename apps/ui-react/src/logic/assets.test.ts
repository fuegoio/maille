import type { Activity, Transaction } from "@maille/core/activities";

import { describe, expect, it } from "vitest";

import { assetTransactions, getAssetTotals, getAssetValue } from "./assets";

const makeTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: "t",
  amount: 100,
  fromAccount: "expense",
  toAccount: "assets-account",
  fromAsset: null,
  toAsset: null,
  ...overrides,
});

const makeActivity = (
  transactions: Transaction[],
  overrides: Partial<Activity> = {},
): Activity =>
  ({
    id: "a",
    name: "Test",
    description: null,
    types: [],
    amounts: {
      expense: 0,
      revenue: 0,
      investment: 0,
      asset: 0,
      neutral: 0,
    },
    date: new Date("2025-01-15"),
    amount: 100,
    category: null,
    subcategory: null,
    project: null,
    transactions,
    movements: [],
    sharing: [],
    status: "completed",
    history: [],
    ...overrides,
  }) as Activity;

describe("assetTransactions", () => {
  it("keeps the transactions coming and going from the asset, with their direction", () => {
    const inLeg = makeTransaction({
      id: "in",
      toAsset: "gold",
      amount: 120,
    });
    const outLeg = makeTransaction({
      id: "out",
      fromAccount: "assets-account",
      toAccount: "expense",
      fromAsset: "gold",
      amount: 30,
    });
    const other = makeTransaction({ id: "other", toAsset: "silver" });
    const activity = makeActivity([inLeg, outLeg, other]);

    expect(assetTransactions([activity], "gold")).toEqual([
      { activity, transaction: inLeg, direction: "in" },
      { activity, transaction: outLeg, direction: "out" },
    ]);
  });
});

describe("getAssetValue", () => {
  it("sums money received minus money given", () => {
    const activity = makeActivity([
      makeTransaction({ id: "in", toAsset: "gold", amount: 120 }),
      makeTransaction({
        id: "out",
        fromAccount: "assets-account",
        toAccount: "expense",
        fromAsset: "gold",
        amount: 30,
      }),
      makeTransaction({ id: "other", toAsset: "silver", amount: 999 }),
    ]);

    expect(getAssetValue([activity], "gold")).toBe(90);
  });
});

describe("getAssetTotals", () => {
  it("splits the flows into in and out totals", () => {
    const activity = makeActivity([
      makeTransaction({ id: "in", toAsset: "gold", amount: 120 }),
      makeTransaction({
        id: "out",
        fromAccount: "assets-account",
        toAccount: "expense",
        fromAsset: "gold",
        amount: 30,
      }),
    ]);

    expect(getAssetTotals([activity], "gold")).toEqual({ in: 120, out: 30 });
  });
});

describe("getAssetValue", () => {
  it("ignores scheduled future transactions, like a depreciation schedule's", () => {
    const past = makeActivity([
      makeTransaction({ id: "in", toAsset: "gold", amount: 1200 }),
    ]);
    const future = makeActivity(
      [makeTransaction({ id: "out", fromAsset: "gold", amount: 50 })],
      { date: new Date("2100-01-01") },
    );

    expect(getAssetValue([past, future], "gold")).toBe(1200);
  });
});
