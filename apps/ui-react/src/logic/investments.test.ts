import type { Investment, InvestmentPrice } from "@maille/core/accounts";

import { describe, expect, it } from "vitest";

import { getAccountEstimation } from "./investments";

const investment = (
  overrides: Partial<Investment> & Pick<Investment, "id">,
): Investment => ({
  account: "acc-1",
  name: "Test",
  symbol: null,
  description: null,
  quantity: 10,
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

const at = new Date("2026-02-01");

describe("getAccountEstimation", () => {
  it("is null when the account holds no position", () => {
    expect(getAccountEstimation([], [], "acc-1", at)).toBeNull();
  });

  it("is null when no position is priced", () => {
    const investments = [investment({ id: "inv-1" })];
    expect(getAccountEstimation(investments, [], "acc-1", at)).toBeNull();
  });

  it("sums position values at their latest price at or before the date", () => {
    const investments = [
      investment({ id: "inv-1", quantity: 10 }),
      investment({ id: "inv-2", account: "acc-1", quantity: 2 }),
    ];
    const prices = [
      price({
        id: "p1",
        investment: "inv-1",
        date: new Date("2026-01-15"),
        price: 100,
      }),
      // A later price on another position sets asOf
      price({
        id: "p2",
        investment: "inv-2",
        date: new Date("2026-01-20"),
        price: 50,
      }),
    ];
    const estimation = getAccountEstimation(investments, prices, "acc-1", at);
    expect(estimation).toEqual({
      value: 10 * 100 + 2 * 50,
      priced: 2,
      positions: 2,
      asOf: new Date("2026-01-20"),
    });
  });

  it("ignores prices after the date and other accounts' positions", () => {
    const investments = [
      investment({ id: "inv-1", quantity: 1 }),
      investment({ id: "inv-2", account: "acc-2" }),
    ];
    const prices = [
      price({
        id: "p1",
        investment: "inv-1",
        date: new Date("2026-01-15"),
        price: 100,
      }),
      // Future price: invisible at `at`
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
    const estimation = getAccountEstimation(investments, prices, "acc-1", at);
    expect(estimation).toEqual({
      value: 100,
      priced: 1,
      positions: 1,
      asOf: new Date("2026-01-15"),
    });
  });

  it("counts unpriced positions but keeps them out of the value", () => {
    const investments = [
      investment({ id: "inv-1", quantity: 10 }),
      investment({ id: "inv-2", account: "acc-1", quantity: 5 }),
    ];
    const prices = [
      price({
        id: "p1",
        investment: "inv-1",
        date: new Date("2026-01-15"),
        price: 100,
      }),
    ];
    const estimation = getAccountEstimation(investments, prices, "acc-1", at);
    expect(estimation).toMatchObject({
      value: 1000,
      priced: 1,
      positions: 2,
    });
  });
});
