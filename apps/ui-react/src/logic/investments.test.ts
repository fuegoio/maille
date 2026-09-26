import type { Investment, InvestmentPrice } from "@maille/core/accounts";
import type { Activity, Transaction } from "@maille/core/activities";

import { describe, expect, it } from "vitest";

import {
  getAccountEstimation,
  getInvestmentTotals,
  investmentQuantityAsOf,
} from "./investments";

const investment = (
  overrides: Partial<Investment> & Pick<Investment, "id">,
): Investment => ({
  account: "acc-1",
  name: "Test",
  symbol: null,
  description: null,
  initialQuantity: 10,
  ...overrides,
});

const price = (
  overrides: Partial<InvestmentPrice> & Pick<InvestmentPrice, "id">,
): InvestmentPrice => ({
  investment: "inv-1",
  date: new Date("2026-01-15"),
  price: 100,
  ...overrides,
});

const activity = (
  date: string,
  transactions: Partial<Transaction>[],
): Activity =>
  ({
    id: `act-${date}-${Math.random()}`,
    name: "Trade",
    description: null,
    date: new Date(date),
    category: null,
    subcategory: null,
    project: null,
    depreciation: null,
    transactions: transactions.map((t, i) => ({
      id: `t-${i}`,
      amount: 100,
      fromAccount: "bank",
      toAccount: "acc-1",
      ...t,
    })) as Transaction[],
    movements: [],
  }) as unknown as Activity;

const at = new Date("2026-02-01");

describe("getAccountEstimation", () => {
  it("is null when the account holds no position", () => {
    expect(getAccountEstimation([], [], [], "acc-1", at)).toBeNull();
  });

  it("is null when no position is priced", () => {
    expect(
      getAccountEstimation([investment({ id: "inv-1" })], [], [], "acc-1", at),
    ).toBeNull();
  });

  it("sums position values at their latest price at or before the date", () => {
    const investments = [
      investment({ id: "inv-1", initialQuantity: 10 }),
      investment({ id: "inv-2", account: "acc-1", initialQuantity: 2 }),
    ];
    const prices = [
      price({
        id: "p1",
        investment: "inv-1",
        date: new Date("2026-01-15"),
        price: 100,
      }),
      price({
        id: "p2",
        investment: "inv-2",
        date: new Date("2026-01-20"),
        price: 50,
      }),
    ];
    const estimation = getAccountEstimation(
      investments,
      [],
      prices,
      "acc-1",
      at,
    );
    expect(estimation).toEqual({
      value: 10 * 100 + 2 * 50,
      valued: 2,
      positions: 2,
      asOf: new Date("2026-01-20"),
    });
  });

  it("ignores prices after the date and other accounts' positions", () => {
    const investments = [
      investment({ id: "inv-1", initialQuantity: 1 }),
      investment({ id: "inv-2", account: "acc-2" }),
    ];
    const prices = [
      price({
        id: "p1",
        investment: "inv-1",
        date: new Date("2026-01-15"),
        price: 100,
      }),
      price({
        id: "p2",
        investment: "inv-1",
        date: new Date("2026-03-01"),
        price: 999,
      }),
      price({
        id: "p3",
        investment: "inv-2",
        date: new Date("2026-01-15"),
        price: 999,
      }),
    ];
    const estimation = getAccountEstimation(
      investments,
      [],
      prices,
      "acc-1",
      at,
    );
    expect(estimation).toEqual({
      value: 100,
      valued: 1,
      positions: 1,
      asOf: new Date("2026-01-15"),
    });
  });

  it("counts unpriced positions but keeps them out of the value", () => {
    const investments = [
      investment({ id: "inv-1", initialQuantity: 10 }),
      investment({ id: "inv-2", account: "acc-1", initialQuantity: 5 }),
    ];
    const prices = [
      price({
        id: "p1",
        investment: "inv-1",
        date: new Date("2026-01-15"),
        price: 100,
      }),
    ];
    const estimation = getAccountEstimation(
      investments,
      [],
      prices,
      "acc-1",
      at,
    );
    expect(estimation).toMatchObject({
      value: 1000,
      valued: 1,
      positions: 2,
    });
  });
});

describe("investmentQuantityAsOf", () => {
  it("is the initial quantity without transactions", () => {
    const inv = investment({ id: "inv-1", initialQuantity: 7 });
    expect(investmentQuantityAsOf(inv, [], at)).toBe(7);
  });

  it("adds buys, subtracts sells, at or before the date", () => {
    const inv = investment({ id: "inv-1", initialQuantity: 10 });
    const activities = [
      activity("2026-01-10", [
        { toInvestment: "inv-1", toQuantity: 5, amount: 500 },
      ]),
      activity("2026-01-20", [
        { fromInvestment: "inv-1", fromQuantity: 3, amount: 300 },
      ]),
      // Future activity: a prevision, not units held yet
      activity("2026-03-01", [
        { toInvestment: "inv-1", toQuantity: 99, amount: 9900 },
      ]),
      // Touching another investment: invisible
      activity("2026-01-25", [
        { toInvestment: "inv-2", toQuantity: 50, amount: 50 },
      ]),
    ];
    expect(investmentQuantityAsOf(inv, activities, at)).toBe(12);
  });
});

describe("getInvestmentTotals", () => {
  it("sums money and units in and out", () => {
    const activities = [
      activity("2026-01-10", [
        { toInvestment: "inv-1", toQuantity: 5, amount: 500 },
      ]),
      activity("2026-01-20", [
        { fromInvestment: "inv-1", fromQuantity: 2, amount: 240 },
      ]),
    ];
    expect(getInvestmentTotals(activities, "inv-1")).toEqual({
      in: 500,
      out: 240,
      quantityIn: 5,
      quantityOut: 2,
    });
  });
});
