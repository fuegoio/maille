import type { Activity, Transaction } from "@maille/core/activities";
import type { Fund, FundMove } from "@maille/core/funds";

import { AccountType, type Account } from "@maille/core/accounts";
import { describe, expect, it } from "vitest";

import {
  buildTransactionRows,
  fundScopeLegs,
  type TransactionViewFilter,
} from "./transaction-view";

const accounts = [
  { id: "bank", name: "Bank", type: AccountType.BANK_ACCOUNT },
  { id: "savings", name: "Savings", type: AccountType.BANK_ACCOUNT },
  { id: "expense", name: "Groceries", type: AccountType.EXPENSE },
  { id: "revenue", name: "Salary", type: AccountType.REVENUE },
] as unknown as Account[];

const fund = (id: string, parentFund: string | null = null): Fund => ({
  id,
  name: id,
  color: "#000000",
  startDate: null,
  endDate: null,
  parentFund,
});

const funds: Fund[] = [
  fund("trip"),
  fund("europe", "trip"),
  fund("asia", "trip"),
  fund("house"),
];

const leg = (
  id: string,
  fromFund: string | null,
  toFund: string | null,
  amount: number,
): FundMove => ({
  id,
  fromFund,
  toFund,
  amount,
  note: null,
  date: new Date(2026, 8, 1),
  transaction: null,
});

const transaction = (
  id: string,
  amount: number,
  fromAccount: string,
  toAccount: string,
  fundMoves: FundMove[] | undefined,
): Transaction => ({
  id,
  amount,
  fromAccount,
  toAccount,
  fundMoves,
});

const activity = (id: string, transactions: Transaction[]): Activity =>
  ({
    id,
    name: `Activity ${id}`,
    date: new Date(2026, 8, 1),
    status: "completed",
    transactions,
  }) as unknown as Activity;

const rowsFor = (activities: Activity[], filter: TransactionViewFilter) =>
  buildTransactionRows(activities, filter, accounts, funds);

describe("fund transaction rows", () => {
  it("shows a fund's boundary transactions, from the fund's side", () => {
    const activities = [
      activity("a", [
        transaction("t1", 100, "bank", "savings", [
          leg("l1", "trip", "house", 100),
        ]),
      ]),
    ];
    const trip = rowsFor(activities, { kind: "fund", fundId: "trip" });
    expect(trip).toHaveLength(1);
    expect(trip[0]).toMatchObject({
      id: "t1",
      direction: "out",
      amount: 100,
      counterpart: { kind: "fund", fund: "house" },
      fund: "trip",
    });
    const house = rowsFor(activities, { kind: "fund", fundId: "house" });
    expect(house[0]).toMatchObject({
      id: "t1",
      direction: "in",
      counterpart: { kind: "fund", fund: "trip" },
    });
    // A fund the transaction never touches shows nothing.
    expect(rowsFor(activities, { kind: "fund", fundId: "asia" })).toEqual([]);
  });

  it("excludes subtree-internal transactions and attributes boundary ones to their subfund", () => {
    const activities = [
      activity("internal", [
        transaction("t1", 50, "bank", "bank", [
          leg("l1", "europe", "asia", 50),
        ]),
      ]),
      activity("boundary", [
        transaction("t2", 80, "bank", "expense", [
          leg("l2", "europe", "house", 80),
        ]),
      ]),
    ];
    const subtree = rowsFor(activities, {
      kind: "fund",
      fundId: "trip",
      subtree: true,
    });
    expect(subtree).toHaveLength(1);
    expect(subtree[0]).toMatchObject({
      id: "t2",
      direction: "out",
      fund: "europe",
      fundIds: ["europe"],
      counterpart: { kind: "fund", fund: "house" },
    });
    // Without the subtree both boundary legs are the subfund's own rows.
    const europe = rowsFor(activities, { kind: "fund", fundId: "europe" });
    expect(europe.map((row) => row.id)).toEqual(["t1", "t2"]);
  });

  it("resolves null sides to external accounts or Untracked", () => {
    const activities = [
      activity("external", [
        transaction("t1", 30, "bank", "expense", [leg("l1", "trip", null, 30)]),
      ]),
      activity("untracked", [
        transaction("t2", 40, "bank", "savings", [leg("l2", "trip", null, 40)]),
      ]),
    ];
    const trip = rowsFor(activities, { kind: "fund", fundId: "trip" });
    expect(trip.map((row) => row.counterpart)).toEqual([
      { kind: "external", account: "expense" },
      { kind: "untracked" },
    ]);
  });

  it("lists Untracked as the null side of every move, external sides excluded", () => {
    const activities = [
      activity("in", [
        transaction("t1", 100, "bank", "savings", [
          leg("l1", "house", null, 100),
        ]),
      ]),
      activity("out", [
        transaction("t2", 50, "bank", "savings", [
          leg("l2", null, "house", 50),
        ]),
      ]),
      activity("external", [
        // The null side faces an Expense account: that is the outside
        // of the balance sheet, never Untracked money.
        transaction("t3", 30, "bank", "expense", [
          leg("l3", "house", null, 30),
        ]),
      ]),
    ];
    const untracked = rowsFor(activities, { kind: "fund", fundId: null });
    expect(untracked).toHaveLength(2);
    expect(untracked[0]).toMatchObject({
      id: "t1",
      direction: "in",
      counterpart: { kind: "fund", fund: "house" },
      fund: null,
    });
    expect(untracked[1]).toMatchObject({
      id: "t2",
      direction: "out",
      counterpart: { kind: "fund", fund: "house" },
    });
  });

  it("keeps only transactions touching the account filter", () => {
    const activities = [
      activity("a", [
        transaction("t1", 100, "bank", "savings", [
          leg("l1", "trip", "house", 100),
        ]),
      ]),
    ];
    expect(
      rowsFor(activities, {
        kind: "fund",
        fundId: "trip",
        accountFilter: "expense",
      }),
    ).toEqual([]);
    expect(
      rowsFor(activities, {
        kind: "fund",
        fundId: "trip",
        accountFilter: "savings",
      }),
    ).toHaveLength(1);
  });

  it("exposes the scope legs the actions retarget", () => {
    const boundary = transaction("t1", 100, "bank", "savings", [
      leg("l1", "trip", "house", 100),
    ]);
    const legs = fundScopeLegs(
      boundary,
      { fundId: "trip", subtree: false },
      accounts,
      funds,
    );
    expect(legs).toHaveLength(1);
    expect(legs[0]).toMatchObject({ side: "fromFund", direction: "out" });
    // Internal legs of the same transaction are out of scope.
    const mixed = transaction("t2", 100, "bank", "savings", [
      leg("l1", "europe", "asia", 40),
      leg("l2", "europe", "house", 60),
    ]);
    expect(
      fundScopeLegs(mixed, { fundId: "trip", subtree: true }, accounts, funds),
    ).toHaveLength(1);
  });
});

describe("account transaction rows", () => {
  it("shows each transaction once per account side, honouring the fund filter", () => {
    const activities = [
      activity("a", [
        transaction("t1", 100, "bank", "savings", [
          leg("l1", "trip", "house", 100),
        ]),
        transaction("t2", 40, "expense", "bank", undefined),
      ]),
    ];
    const bank = rowsFor(activities, {
      kind: "account",
      accountId: "bank",
    });
    expect(bank).toHaveLength(2);
    expect(bank[0]).toMatchObject({
      id: "t1",
      direction: "out",
      counterpart: { kind: "account", account: "savings" },
      fund: "trip",
    });
    expect(bank[1]).toMatchObject({ id: "t2", direction: "in", fund: null });

    const untrackedOnly = rowsFor(activities, {
      kind: "account",
      accountId: "bank",
      fundFilter: null,
    });
    expect(untrackedOnly.map((row) => row.id)).toEqual(["t2"]);
    const tripOnly = rowsFor(activities, {
      kind: "account",
      accountId: "bank",
      fundFilter: "trip",
    });
    expect(tripOnly.map((row) => row.id)).toEqual(["t1"]);
  });
});

describe("month transaction rows", () => {
  it("reads each transaction once from the balance sheet's side", () => {
    const activities = [
      activity("revenue", [
        transaction("t1", 100, "revenue", "bank", undefined),
      ]),
      activity("expense", [
        transaction("t2", 40, "bank", "expense", undefined),
      ]),
      activity("transfer", [
        transaction("t3", 50, "bank", "savings", undefined),
      ]),
    ];
    const rows = rowsFor(activities, {
      kind: "month",
      month: 9,
      year: 2026,
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      id: "t1",
      direction: "in",
      counterpart: { kind: "account", account: "revenue" },
      amount: 100,
    });
    expect(rows[1]).toMatchObject({
      id: "t2",
      direction: "out",
      counterpart: { kind: "account", account: "expense" },
      amount: 40,
    });
    // A transfer inside the balance sheet is neutral: it never enters
    // or leaves, so the counterpart is the receiving account.
    expect(rows[2]).toMatchObject({
      id: "t3",
      direction: "zero",
      counterpart: { kind: "account", account: "savings" },
      amount: 50,
    });
  });

  it("keeps to the month's activities", () => {
    const inMonth = activity("in", [
      transaction("t1", 100, "revenue", "bank", undefined),
    ]);
    const otherMonth = {
      ...activity("out", [transaction("t2", 40, "bank", "expense", undefined)]),
      date: new Date(2026, 9, 1),
    } as unknown as Activity;
    const rows = rowsFor([inMonth, otherMonth], {
      kind: "month",
      month: 9,
      year: 2026,
    });
    expect(rows.map((row) => row.id)).toEqual(["t1"]);
  });

  it("lists every fund the legs touch, unallocated amounts Untracked", () => {
    const activities = [
      activity("a", [
        transaction("t1", 100, "revenue", "bank", [
          leg("l1", "trip", "europe", 30),
        ]),
      ]),
    ];
    const rows = rowsFor(activities, {
      kind: "month",
      month: 9,
      year: 2026,
    });
    expect(rows[0]).toMatchObject({
      fundIds: ["trip", "europe", null],
    });
  });
});
