import { describe, expect, it } from "vitest";

import {
  ActivityType,
  deriveActivityTypes,
  getActivityAmounts,
  getActivityAmountsTotal,
  sumActivityAmounts,
  type Transaction,
} from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";

const accounts = [
  { id: "bank", type: AccountType.BANK_ACCOUNT, movements: true },
  { id: "cash", type: AccountType.CASH, movements: false },
  { id: "expense", type: AccountType.EXPENSE, movements: false },
  { id: "revenue", type: AccountType.REVENUE, movements: false },
  { id: "investment", type: AccountType.INVESTMENT_ACCOUNT, movements: false },
];

const transaction = (fromAccount: string, toAccount: string, amount: number): Transaction => ({
  id: `${fromAccount}-${toAccount}-${amount}`,
  amount,
  fromAccount,
  toAccount,
});

describe("deriveActivityTypes", () => {
  it("derives expense from an expense account leg", () => {
    expect(deriveActivityTypes([transaction("bank", "expense", 10)], accounts)).toEqual([
      ActivityType.EXPENSE,
    ]);
  });

  it("derives revenue from a revenue account leg", () => {
    expect(deriveActivityTypes([transaction("revenue", "bank", 10)], accounts)).toEqual([
      ActivityType.REVENUE,
    ]);
  });

  it("derives investment from an investment account leg", () => {
    expect(deriveActivityTypes([transaction("bank", "investment", 10)], accounts)).toEqual([
      ActivityType.INVESTMENT,
    ]);
  });

  it("attaches multiple types when several typed accounts are involved", () => {
    const transactions = [transaction("bank", "expense", 5), transaction("revenue", "bank", 100)];
    expect(deriveActivityTypes(transactions, accounts)).toEqual([
      ActivityType.EXPENSE,
      ActivityType.REVENUE,
    ]);
  });

  it("derives neutral for transfers between untyped accounts", () => {
    expect(deriveActivityTypes([transaction("bank", "cash", 10)], accounts)).toEqual([
      ActivityType.NEUTRAL,
    ]);
  });

  it("attaches neutral alongside typed amounts for mixed activities", () => {
    const transactions = [transaction("bank", "expense", 5), transaction("bank", "cash", 100)];
    expect(deriveActivityTypes(transactions, accounts)).toEqual([
      ActivityType.EXPENSE,
      ActivityType.NEUTRAL,
    ]);
  });

  it("derives neutral when there are no transactions", () => {
    expect(deriveActivityTypes([], accounts)).toEqual([ActivityType.NEUTRAL]);
  });
});

describe("getActivityAmounts", () => {
  it("sums an expense as money flowing into the expense account", () => {
    const amounts = getActivityAmounts([transaction("bank", "expense", 10)], accounts);
    expect(amounts[ActivityType.EXPENSE]).toBe(10);
    expect(getActivityAmountsTotal(amounts)).toBe(10);
  });

  it("sums a refund as negative expense", () => {
    const amounts = getActivityAmounts([transaction("expense", "bank", 10)], accounts);
    expect(amounts[ActivityType.EXPENSE]).toBe(-10);
  });

  it("sums revenue as money coming from the revenue account", () => {
    const amounts = getActivityAmounts([transaction("revenue", "bank", 100)], accounts);
    expect(amounts[ActivityType.REVENUE]).toBe(100);
  });

  it("sums an investment contribution positively and a sale negatively", () => {
    const contribution = getActivityAmounts([transaction("bank", "investment", 100)], accounts);
    expect(contribution[ActivityType.INVESTMENT]).toBe(100);
    const sale = getActivityAmounts([transaction("investment", "bank", 100)], accounts);
    expect(sale[ActivityType.INVESTMENT]).toBe(-100);
  });

  it("sums transfers between untyped accounts as neutral", () => {
    const amounts = getActivityAmounts([transaction("bank", "cash", 100)], accounts);
    expect(amounts[ActivityType.NEUTRAL]).toBe(100);
  });

  it("carries one amount per type for a mixed activity", () => {
    const transactions = [
      transaction("investment", "bank", 100),
      transaction("bank", "expense", 5),
      transaction("bank", "cash", 20),
    ];
    const amounts = getActivityAmounts(transactions, accounts);
    expect(amounts).toEqual({
      [ActivityType.EXPENSE]: 5,
      [ActivityType.REVENUE]: 0,
      [ActivityType.INVESTMENT]: -100,
      [ActivityType.NEUTRAL]: 20,
    });
    expect(getActivityAmountsTotal(amounts)).toBe(-75);
  });
});

describe("sumActivityAmounts", () => {
  it("sums per-type amounts across activities", () => {
    const totals = sumActivityAmounts([
      { amounts: { expense: 10, revenue: 0, investment: -100, neutral: 20 } },
      { amounts: { expense: 5, revenue: 100, investment: 0, neutral: 0 } },
    ]);

    expect(totals).toEqual({
      expense: 15,
      revenue: 100,
      investment: -100,
      neutral: 20,
    });
  });

  it("returns zeroed amounts for an empty set", () => {
    expect(sumActivityAmounts([])).toEqual({
      expense: 0,
      revenue: 0,
      investment: 0,
      neutral: 0,
    });
  });
});
