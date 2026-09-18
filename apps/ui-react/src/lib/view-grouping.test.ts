import { AccountType } from "@maille/core/accounts";
import { ActivityType, type Activity } from "@maille/core/activities";
import { describe, expect, it } from "vitest";

import {
  activityGroupAccessors,
  activityViewDescriptor,
  ACTIVITY_VIEW_GROUPINGS,
  visibleActivityAmountTypes,
} from "@/components/activities/activity-view";
import { movementGroupAccessors } from "@/components/movements/movement-view";
import { computeRowOutlines } from "@/components/shared/row-outline";
import {
  accountTransactionFunds,
  transactionCounterpartGroup,
  transactionFundGroup,
  transactionGroupAccessors,
  transactionOrderingAccessors,
  type TransactionRow,
} from "@/components/transactions/transaction-view";

import { groupViewRows, namedGroup, viewGroupOrder } from "./view-grouping";
import { sortViewRows } from "./view-ordering";

const rows = [
  { id: "a", date: new Date(2026, 8, 18), amount: 10, category: "one" },
  { id: "b", date: new Date(2026, 7, 18), amount: 20, category: "two" },
  { id: "c", date: new Date(2025, 8, 18), amount: 30, category: "one" },
];
const category = {
  category: (row: (typeof rows)[number]) =>
    namedGroup(row.category, "Same name", "No category"),
};

function headers<T>(
  items: ReturnType<typeof groupViewRows<T & { id: string; date: Date }>>,
) {
  return items.filter((item) => item.itemType === "group");
}

describe("view grouping", () => {
  it("passes through ungrouped and unknown modes without mutating rows", () => {
    for (const grouping of ["none", "obsolete"]) {
      const items = groupViewRows(rows, grouping);
      expect(items.map((row) => row.id)).toEqual(["a", "b", "c"]);
      expect(items.every((row) => row.itemType === "row")).toBe(true);
    }
    expect(rows[0]).not.toHaveProperty("itemType");
  });

  it("partitions each row once, preserving row order and exact totals", () => {
    const items = groupViewRows(rows, "category", category, "asc");
    expect(
      headers(items).map((group) => group.rows.map((row) => row.id)),
    ).toEqual([["a", "c"], ["b"]]);
    expect(
      headers(items)
        .flatMap((group) => group.rows)
        .reduce((sum, row) => sum + row.amount, 0),
    ).toBe(60);
    expect(
      new Set(
        items.filter((item) => item.itemType === "row").map((row) => row.id),
      ).size,
    ).toBe(3);
  });

  it("separates equal labels by entity id and retains missing metadata", () => {
    expect(headers(groupViewRows(rows, "category", category))).toHaveLength(2);
    expect(namedGroup(null, undefined, "No category")).toEqual({
      key: "none",
      label: "No category",
    });
  });

  it("orders periods chronologically across years in both directions", () => {
    expect(
      headers(groupViewRows(rows, "period")).map((group) => group.rows[0].id),
    ).toEqual(["a", "b", "c"]);
    expect(
      headers(groupViewRows(rows, "period", {}, "asc")).map(
        (group) => group.rows[0].id,
      ),
    ).toEqual(["c", "b", "a"]);
    expect(
      headers(groupViewRows(rows, "year")).map((group) => group.rows.length),
    ).toEqual([2, 1]);
  });

  it("uses local dates and Monday-based weeks across the year boundary", () => {
    const dates = [
      new Date(2025, 11, 29, 23),
      new Date(2026, 0, 4, 1),
      new Date(2026, 0, 5),
    ];
    const input = dates.map((date, index) => ({ date, id: String(index) }));
    expect(headers(groupViewRows(input, "day"))).toHaveLength(3);
    expect(
      headers(groupViewRows(input, "week", {}, "asc")).map(
        (group) => group.rows.length,
      ),
    ).toEqual([2, 1]);
    expect(headers(groupViewRows(input, "week", {}, "asc"))[0].key).toBe(
      "2025-11-29",
    );
  });

  it("folds only a namespaced group while keeping its full total and count", () => {
    const groups = headers(groupViewRows(rows, "category", category));
    const items = groupViewRows(rows, "category", category, "asc", [
      groups.find((group) => group.key === "one")!.id,
    ]);
    expect(
      items.filter((row) => row.itemType === "row").map((row) => row.id),
    ).toEqual(["b"]);
    expect(headers(items).map((group) => group.rows.length)).toEqual([2, 1]);
    expect(
      groupViewRows(rows, "period", {}, "desc", [groups[0].id]).filter(
        (row) => row.itemType === "row",
      ),
    ).toHaveLength(3);
  });

  it("uses group headers as selection outline breaks", () => {
    const items = groupViewRows(rows, "category", category, "asc");
    const outlines = computeRowOutlines(
      items.map((row) =>
        row.itemType === "group" ? "break" : { id: row.id, selected: true },
      ),
    );
    expect(outlines.get("a")).toEqual({ top: true, bottom: false });
    expect(outlines.get("c")).toEqual({ top: false, bottom: true });
    expect(outlines.get("b")).toEqual({ top: true, bottom: true });
  });

  it("leaves empty inputs empty and uses date direction only for date groups", () => {
    expect(groupViewRows([], "period")).toEqual([]);
    expect(viewGroupOrder("period", { field: "date", direction: "asc" })).toBe(
      "asc",
    );
    expect(
      viewGroupOrder("period", { field: "amount", direction: "asc" }),
    ).toBe("desc");
    expect(
      viewGroupOrder("category", { field: "date", direction: "desc" }),
    ).toBe("asc");
  });
});

describe("resource view semantics", () => {
  it("offers exactly the activity groupings accepted by the table", () => {
    expect(
      activityViewDescriptor.groupings.map((option) => option.value),
    ).toEqual([...ACTIVITY_VIEW_GROUPINGS]);
  });

  it("keeps mixed activity types together once, regardless of source type order", () => {
    const input = [
      { ...rows[0], types: [ActivityType.EXPENSE, ActivityType.REVENUE] },
      { ...rows[1], types: [ActivityType.REVENUE, ActivityType.EXPENSE] },
    ] as unknown as Activity[];
    const result = groupViewRows(
      input,
      "type",
      activityGroupAccessors([], [], []),
    );
    expect(headers(result)).toHaveLength(1);
    expect(headers(result)[0].label).toBe("Revenue + Expense");
    expect(headers(result)[0].rows).toHaveLength(2);
    expect(result.filter((row) => row.itemType === "row")).toHaveLength(2);
  });

  it("allows individual amounts or no amounts without filtering activities", () => {
    expect(
      visibleActivityAmountTypes(["name", "amount:expense", "amount:asset"]),
    ).toEqual([ActivityType.EXPENSE, ActivityType.ASSET]);
    expect(visibleActivityAmountTypes(["name"])).toEqual([]);
  });

  it("distinguishes zero movements from inflows and outflows", () => {
    const accessors = movementGroupAccessors([]);
    expect(
      [-5, 0, 5].map((amount) => accessors.direction({ amount } as never).key),
    ).toEqual(["out", "zero", "in"]);
  });

  it("sorts transaction amounts by their signed perspective", () => {
    const input = [
      { ...rows[0], amount: 10, direction: "in" },
      { ...rows[1], amount: 30, direction: "out" },
    ] as unknown as TransactionRow[];
    expect(
      sortViewRows(
        input,
        { field: "amount", direction: "asc" },
        transactionOrderingAccessors,
      ).map((row) => row.id),
    ).toEqual(["b", "a"]);
  });

  it("does not attribute split-fund transaction totals to just one fund", () => {
    const transaction = {
      amount: 100,
      fromAccount: "bank",
      toAccount: "expense",
      fundMoves: [
        { fromFund: "one", toFund: null, amount: 40 },
        { fromFund: "two", toFund: null, amount: 60 },
      ],
    } as never;
    const fundIds = accountTransactionFunds(transaction, "bank");
    expect(fundIds).toEqual(["one", "two"]);
    expect(transactionFundGroup({ fundIds }, []).label).toBe("Mixed funds");
    expect(accountTransactionFunds(transaction, "expense")).toEqual([null]);
  });

  it("includes the implicit Untracked remainder and ignores non-positive legs", () => {
    const transaction = {
      amount: 100,
      fromAccount: "bank",
      toAccount: "expense",
      fundMoves: [
        { fromFund: "one", toFund: null, amount: 40 },
        { fromFund: "ignored", toFund: null, amount: 0 },
        { fromFund: "ignored", toFund: null, amount: -5 },
      ],
    } as never;
    expect(accountTransactionFunds(transaction, "bank")).toEqual(["one", null]);
    const fullyFunded = {
      ...(transaction as import("@maille/core/activities").Transaction),
      amount: 40,
    };
    expect(accountTransactionFunds(fullyFunded, "bank")).toEqual(["one"]);
  });

  it("groups external expense/revenue counterparts separately from Untracked", () => {
    const accounts = [
      { id: "bank", name: "Bank", type: AccountType.BANK_ACCOUNT },
      { id: "expense", name: "Expense", type: AccountType.EXPENSE },
    ];
    expect(
      transactionCounterpartGroup(
        { kind: "external", account: "expense" },
        accounts,
        [],
      ),
    ).toMatchObject({ key: "external:expense", label: "Expense" });
    expect(
      transactionCounterpartGroup({ kind: "untracked" }, accounts, []).label,
    ).toBe("Untracked");
  });
});

describe("group presentation metadata", () => {
  it("carries category and project emoji separately from identity and sorting", () => {
    const accessors = activityGroupAccessors(
      [{ id: "food", name: "Food", emoji: "\u{1F37D}" }],
      [],
      [{ id: "trip", name: "Trip", emoji: "\u{1F9F3}" }],
    );
    const row = { category: "food", project: "trip" } as Activity;
    expect(accessors.category(row)).toMatchObject({
      key: "food",
      label: "Food",
      marker: { kind: "emoji", value: "\u{1F37D}" },
    });
    expect(accessors.project(row).marker).toEqual({
      kind: "emoji",
      value: "\u{1F9F3}",
    });
    expect(accessors.category({ category: null } as Activity).marker).toEqual({
      kind: "icon",
      name: "category",
    });
  });

  it("uses the subcategory's own category for its breadcrumb", () => {
    const accessors = activityGroupAccessors(
      [{ id: "food", name: "Food", emoji: "\u{1F37D}" }],
      [
        {
          id: "groceries",
          name: "Groceries",
          category: "food",
          emoji: "\u{1F6D2}",
        },
      ],
      [],
    );
    const group = accessors.subcategory({
      subcategory: "groceries",
      category: "stale",
    } as Activity);
    expect(group).toMatchObject({
      key: "groceries",
      label: "Groceries",
      marker: { kind: "emoji", value: "\u{1F6D2}" },
      parent: { label: "Food", marker: { kind: "emoji", value: "\u{1F37D}" } },
    });
    expect(
      accessors.subcategory({ subcategory: null } as Activity).parent,
    ).toBeUndefined();
  });

  it("carries account types in movements and transaction counterpart groups", () => {
    const accounts = [
      { id: "bank", name: "Bank", type: AccountType.BANK_ACCOUNT },
    ];
    expect(
      movementGroupAccessors(accounts).account({ account: "bank" } as never)
        .marker,
    ).toEqual({ kind: "account", type: AccountType.BANK_ACCOUNT });
    expect(
      transactionGroupAccessors(accounts, []).counterpart({
        counterpart: { kind: "account", account: "bank" },
      } as never).marker,
    ).toEqual({ kind: "account", type: AccountType.BANK_ACCOUNT });
  });

  it("keeps fund colors in transaction groups, with explicit fallbacks", () => {
    const funds = [{ id: "food", name: "Food", color: "#336699" }];
    expect(transactionFundGroup({ fundIds: ["food"] }, funds).marker).toEqual({
      kind: "fund",
      color: "#336699",
    });
    expect(transactionFundGroup({ fundIds: [null] }, funds).marker).toEqual({
      kind: "icon",
      name: "untracked",
    });
    expect(
      transactionFundGroup({ fundIds: ["food", null] }, funds).marker,
    ).toEqual({ kind: "icon", name: "mixed-funds" });
    expect(
      transactionCounterpartGroup({ kind: "fund", fund: "food" }, [], funds)
        .marker,
    ).toEqual({ kind: "fund", color: "#336699" });
  });

  it("retains decoration on folded headers without changing their rows or keys", () => {
    const accessors = {
      category: (row: (typeof rows)[number]) => ({
        ...namedGroup(row.category, "Food", "No category"),
        marker: { kind: "emoji" as const, value: "\u{1F37D}" },
      }),
    };
    const items = groupViewRows(rows, "category", accessors, "asc", [
      "group:category:one",
    ]);
    const group = headers(items)[0];
    expect(group.id).toBe("group:category:one");
    expect(group.marker).toEqual({ kind: "emoji", value: "\u{1F37D}" });
    expect(group.rows.map((row) => row.id)).toEqual(["a", "c"]);
  });
});
