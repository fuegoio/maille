import type {
  Activity,
  ActivityAmounts,
  Transaction,
} from "@maille/core/activities";

import { ActivityType } from "@maille/core/activities";
import { describe, expect, it } from "vitest";

import {
  duplicateActivities,
  getActivityTypeTotalForMonth,
  getActivityTypeTotalForProject,
} from "./activities";

const zeroAmounts = (): ActivityAmounts => ({
  expense: 0,
  revenue: 0,
  investment: 0,
  neutral: 0,
});

/** A single-type activity contributing `amount` to that type's column. */
const typed = (type: ActivityType, amount: number) => ({
  types: [type],
  amounts: { ...zeroAmounts(), [type]: amount },
});

const makeActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: "a",
  name: "Test",
  description: null,
  types: [],
  amounts: zeroAmounts(),
  date: new Date("2025-01-15"),
  amount: 100,
  category: null,
  subcategory: null,
  project: null,
  transactions: [],
  movements: [],
  sharing: [],
  status: "completed" as const,
  history: [],
  ...overrides,
});

describe("getActivityTypeTotalForMonth", () => {
  it("sums activities of the right type in the target month", () => {
    const activities = [
      makeActivity({
        id: "1",
        date: new Date("2025-03-10"),
        amount: 50,
        ...typed(ActivityType.EXPENSE, 50),
      }),
      makeActivity({
        id: "2",
        date: new Date("2025-03-20"),
        amount: 80,
        ...typed(ActivityType.EXPENSE, 80),
      }),
      makeActivity({
        id: "3",
        date: new Date("2025-03-05"),
        amount: 200,
        ...typed(ActivityType.REVENUE, 200),
      }),
    ];

    const result = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(130);
  });

  it("excludes activities from the same month in a different year", () => {
    const activities = [
      makeActivity({
        id: "1",
        date: new Date("2025-01-10"),
        amount: 100,
        ...typed(ActivityType.EXPENSE, 100),
      }),
      makeActivity({
        id: "2",
        date: new Date("2024-01-10"),
        amount: 999,
        ...typed(ActivityType.EXPENSE, 999),
      }),
    ];

    const result = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-01-01"),
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(100);
  });

  it("excludes activities from other months in the same year", () => {
    const activities = [
      makeActivity({
        id: "1",
        date: new Date("2025-03-15"),
        amount: 60,
        ...typed(ActivityType.EXPENSE, 60),
      }),
      makeActivity({
        id: "2",
        date: new Date("2025-04-01"),
        amount: 40,
        ...typed(ActivityType.EXPENSE, 40),
      }),
    ];

    const result = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(60);
  });

  it("returns 0 when there are no matching activities", () => {
    const activities = [
      makeActivity({
        id: "1",
        date: new Date("2025-03-10"),
        amount: 500,
        ...typed(ActivityType.REVENUE, 500),
      }),
    ];

    const result = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(0);
  });

  it("includes an activity on the last day of the month", () => {
    const activities = [
      makeActivity({
        id: "1",
        date: new Date("2025-03-31"),
        amount: 75,
        ...typed(ActivityType.EXPENSE, 75),
      }),
    ];

    const result = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(75);
  });

  it("only sums the per-type amount of multi-type activities", () => {
    const activities = [
      makeActivity({
        id: "1",
        date: new Date("2025-03-10"),
        amount: 300,
        types: [ActivityType.EXPENSE, ActivityType.INVESTMENT],
        amounts: {
          ...zeroAmounts(),
          expense: 100,
          investment: 200,
        },
      }),
    ];

    const expenseTotal = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.EXPENSE,
      activities,
    });
    const investmentTotal = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.INVESTMENT,
      activities,
    });

    expect(expenseTotal).toBe(100);
    expect(investmentTotal).toBe(200);
  });

  it("returns 0 for an empty activity list", () => {
    const result = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.EXPENSE,
      activities: [],
    });

    expect(result).toBe(0);
  });
});

describe("getActivityTypeTotalForProject", () => {
  it("sums activities of the right type for the target project", () => {
    const activities = [
      makeActivity({
        id: "1",
        project: "proj-1",
        amount: 120,
        ...typed(ActivityType.EXPENSE, 120),
      }),
      makeActivity({
        id: "2",
        project: "proj-1",
        amount: 80,
        ...typed(ActivityType.EXPENSE, 80),
      }),
      makeActivity({
        id: "3",
        project: "proj-1",
        amount: 500,
        ...typed(ActivityType.REVENUE, 500),
      }),
      makeActivity({
        id: "4",
        project: "proj-2",
        amount: 999,
        ...typed(ActivityType.EXPENSE, 999),
      }),
    ];

    const result = getActivityTypeTotalForProject({
      projectId: "proj-1",
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(200);
  });

  it("excludes activities from other projects", () => {
    const activities = [
      makeActivity({
        id: "1",
        project: "proj-1",
        amount: 50,
        ...typed(ActivityType.EXPENSE, 50),
      }),
      makeActivity({
        id: "2",
        project: "proj-2",
        amount: 300,
        ...typed(ActivityType.EXPENSE, 300),
      }),
    ];

    const result = getActivityTypeTotalForProject({
      projectId: "proj-1",
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(50);
  });

  it("returns 0 when no activities match the project", () => {
    const activities = [
      makeActivity({
        id: "1",
        project: "proj-2",
        amount: 100,
        ...typed(ActivityType.EXPENSE, 100),
      }),
    ];

    const result = getActivityTypeTotalForProject({
      projectId: "proj-1",
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(0);
  });

  it("returns 0 for an empty activity list", () => {
    const result = getActivityTypeTotalForProject({
      projectId: "proj-1",
      activityType: ActivityType.EXPENSE,
      activities: [],
    });

    expect(result).toBe(0);
  });
});

describe("duplicateActivities", () => {
  it("copies activity fields with fresh ids for the activity and its transactions", () => {
    const activity = makeActivity({
      id: "original",
      name: "Rent",
      description: "Monthly rent",
      date: new Date("2025-03-10"),
      category: "cat-rent",
      subcategory: "sub-home",
      project: "proj-1",
      transactions: [
        {
          id: "t1",
          amount: 900,
          fromAccount: "bank",
          toAccount: "landlord",
        },
      ],
    });

    const [duplicate] = duplicateActivities({
      activities: [activity],
      generateId: () => "new-id",
    });

    expect(duplicate).toEqual({
      id: "new-id",
      name: "Rent",
      description: "Monthly rent",
      date: new Date("2025-03-10"),
      category: "cat-rent",
      subcategory: "sub-home",
      project: "proj-1",
      transactions: [
        {
          id: "new-id",
          amount: 900,
          fromAccount: "bank",
          fromAsset: null,
          fromCounterparty: null,
          toAccount: "landlord",
          toAsset: null,
          toCounterparty: null,
        },
      ],
    });
    expect(duplicate.id).not.toBe(activity.id);
    expect(duplicate.transactions[0].id).not.toBe(activity.transactions[0].id);
  });

  it("does not carry over computed or linked fields", () => {
    const activity = makeActivity({
      id: "original",
      ...typed(ActivityType.EXPENSE, 100),
      movements: [{ id: "am1", movement: "m1", amount: -900 }],
      sharing: [
        {
          user: "u1",
          liability: 450,
          accounts: [{ account: "bank", amount: -450 }],
        },
      ],
    });

    const [duplicate] = duplicateActivities({
      activities: [activity],
      generateId: () => "new-id",
    });

    expect(duplicate).not.toHaveProperty("amount");
    expect(duplicate).not.toHaveProperty("types");
    expect(duplicate).not.toHaveProperty("amounts");
    expect(duplicate).not.toHaveProperty("status");
    expect(duplicate).not.toHaveProperty("movements");
    expect(duplicate).not.toHaveProperty("sharing");
  });

  it("strips extra transaction fields added by sync events", () => {
    const activity = makeActivity({
      id: "original",
      transactions: [
        {
          id: "t1",
          // Added to stored transactions by addTransaction sync events.
          activityId: "original",
          amount: 900,
          fromAccount: "bank",
          toAccount: "landlord",
        } as Transaction,
      ],
    });

    const [duplicate] = duplicateActivities({
      activities: [activity],
      generateId: () => "new-id",
    });

    expect(duplicate.transactions[0]).toEqual({
      id: "new-id",
      amount: 900,
      fromAccount: "bank",
      fromAsset: null,
      fromCounterparty: null,
      toAccount: "landlord",
      toAsset: null,
      toCounterparty: null,
    });
  });

  it("duplicates each activity independently", () => {
    const activities = [
      makeActivity({ id: "1", name: "One" }),
      makeActivity({ id: "2", name: "Two" }),
    ];

    const duplicates = duplicateActivities({
      activities,
      generateId: (() => {
        let i = 0;
        return () => `new-${++i}`;
      })(),
    });

    expect(duplicates).toHaveLength(2);
    expect(duplicates[0].id).toBe("new-1");
    expect(duplicates[1].id).toBe("new-2");
    expect(duplicates.map((a) => a.name)).toEqual(["One", "Two"]);
  });
});
