import { describe, expect, it } from "vitest";

import { ActivityType } from "@maille/core/activities";
import {
  buildAddTransactionEntry,
  buildUpdateLinkEntry,
  diffActivity,
  diffMovement,
  diffTransaction,
} from "@maille/core/history";
import type {
  ActivityHistorySnapshot,
  MovementHistorySnapshot,
  TransactionHistorySnapshot,
} from "@maille/core/history";

const activitySnapshot = (
  partial: Partial<ActivityHistorySnapshot> = {},
): ActivityHistorySnapshot => ({
  name: "Lunch",
  description: null,
  date: "2026-09-08T00:00:00.000Z",
  type: ActivityType.EXPENSE,
  category: null,
  subcategory: null,
  project: null,
  ...partial,
});

describe("diffActivity", () => {
  it("returns no changes for identical snapshots", () => {
    expect(diffActivity(activitySnapshot(), activitySnapshot())).toEqual([]);
  });

  it("detects scalar field changes", () => {
    const before = activitySnapshot();
    const after = activitySnapshot({
      name: "Team lunch",
      description: "with J.",
    });

    expect(diffActivity(before, after)).toEqual([
      { field: "name", from: "Lunch", to: "Team lunch" },
      { field: "description", from: null, to: "with J." },
    ]);
  });

  it("carries labels and refs for reference fields", () => {
    const before = activitySnapshot({
      category: { id: "cat1", label: "Groceries" },
    });
    const after = activitySnapshot({
      category: { id: "cat2", label: "Transport" },
    });

    expect(diffActivity(before, after)).toEqual([
      {
        field: "category",
        from: "Groceries",
        to: "Transport",
        fromRef: { type: "category", id: "cat1" },
        toRef: { type: "category", id: "cat2" },
      },
    ]);
  });

  it("reports clearing a reference field", () => {
    const before = activitySnapshot({
      project: { id: "p1", label: "Trip" },
    });
    const after = activitySnapshot();

    expect(diffActivity(before, after)).toEqual([
      {
        field: "project",
        from: "Trip",
        to: null,
        fromRef: { type: "project", id: "p1" },
      },
    ]);
  });
});

describe("diffMovement", () => {
  const before: MovementHistorySnapshot = {
    name: "STEAM",
    date: "2026-09-07T00:00:00.000Z",
    amount: 59.99,
    account: { id: "acc1", label: "Checking" },
  };

  it("returns no changes for identical snapshots", () => {
    expect(diffMovement(before, { ...before })).toEqual([]);
  });

  it("detects value and reference changes", () => {
    expect(
      diffMovement(before, {
        name: "STEAM PURCHASE",
        date: "2026-09-08T00:00:00.000Z",
        amount: 60,
        account: { id: "acc2", label: "Credit card" },
      }),
    ).toEqual([
      { field: "name", from: "STEAM", to: "STEAM PURCHASE" },
      { field: "date", from: "2026-09-07T00:00:00.000Z", to: "2026-09-08T00:00:00.000Z" },
      { field: "amount", from: 59.99, to: 60 },
      {
        field: "account",
        from: "Checking",
        to: "Credit card",
        fromRef: { type: "account", id: "acc1" },
        toRef: { type: "account", id: "acc2" },
      },
    ]);
  });
});

describe("transaction entries", () => {
  const transaction: TransactionHistorySnapshot = {
    amount: 59.99,
    from: { ref: { type: "account", id: "acc1" }, label: "Checking" },
    to: { ref: { type: "asset", id: "asset1" }, label: "Laptop" },
  };

  it("builds an addTransaction entry from the legs", () => {
    expect(buildAddTransactionEntry("activity", "a1", transaction)).toEqual({
      entityType: "activity",
      entityId: "a1",
      action: "addTransaction",
      changes: [
        { field: "amount", from: null, to: 59.99 },
        {
          field: "from",
          from: null,
          to: "Checking",
          toRef: { type: "account", id: "acc1" },
        },
        {
          field: "to",
          from: null,
          to: "Laptop",
          toRef: { type: "asset", id: "asset1" },
        },
      ],
    });
  });

  it("diffs transaction updates", () => {
    const before: TransactionHistorySnapshot = {
      amount: 59.99,
      from: { ref: { type: "account", id: "acc1" }, label: "Checking" },
      to: { ref: { type: "asset", id: "asset1" }, label: "Laptop" },
    };
    const after: TransactionHistorySnapshot = {
      amount: 70,
      from: { ref: { type: "account", id: "acc1" }, label: "Checking" },
      to: { ref: { type: "account", id: "acc3" }, label: "Gear" },
    };

    expect(diffTransaction(before, after)).toEqual([
      { field: "amount", from: 59.99, to: 70 },
      {
        field: "to",
        from: "Laptop",
        to: "Gear",
        fromRef: { type: "asset", id: "asset1" },
        toRef: { type: "account", id: "acc3" },
      },
    ]);
  });
});

describe("link entries", () => {
  it("skips the updateLink entry when the amount did not change", () => {
    expect(
      buildUpdateLinkEntry(
        "activity",
        "a1",
        { type: "movement", id: "m1", label: "STEAM" },
        59.99,
        59.99,
      ),
    ).toBeNull();
  });
});
