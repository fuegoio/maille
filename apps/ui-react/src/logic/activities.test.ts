import { ActivityType } from "@maille/core/activities";
import { describe, expect, it } from "vitest";

import {
  getActivityCategoryTotalForMonth,
  getActivityTypeTotalForMonth,
  getActivityTypeTotalForProject,
} from "./activities";

const makeActivity = (
  overrides: Partial<{
    id: string;
    type: ActivityType;
    date: Date;
    amount: number;
    category: string | null;
    subcategory: string | null;
    project: string | null;
  }>,
) => ({
  id: "a",
  name: "Test",
  description: null,
  type: ActivityType.EXPENSE,
  date: new Date("2025-01-15"),
  amount: 100,
  category: null,
  subcategory: null,
  project: null,
  transactions: [],
  movements: [],
  sharing: [],
  status: "completed" as const,
  ...overrides,
});

describe("getActivityTypeTotalForMonth", () => {
  it("sums activities of the right type in the target month", () => {
    const activities = [
      makeActivity({
        id: "1",
        type: ActivityType.EXPENSE,
        date: new Date("2025-03-10"),
        amount: 50,
      }),
      makeActivity({
        id: "2",
        type: ActivityType.EXPENSE,
        date: new Date("2025-03-20"),
        amount: 80,
      }),
      makeActivity({
        id: "3",
        type: ActivityType.REVENUE,
        date: new Date("2025-03-05"),
        amount: 200,
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
        type: ActivityType.EXPENSE,
        date: new Date("2025-01-10"),
        amount: 100,
      }),
      makeActivity({
        id: "2",
        type: ActivityType.EXPENSE,
        date: new Date("2024-01-10"),
        amount: 999,
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
        type: ActivityType.EXPENSE,
        date: new Date("2025-03-15"),
        amount: 60,
      }),
      makeActivity({
        id: "2",
        type: ActivityType.EXPENSE,
        date: new Date("2025-04-01"),
        amount: 40,
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
        type: ActivityType.REVENUE,
        date: new Date("2025-03-10"),
        amount: 500,
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
        type: ActivityType.EXPENSE,
        date: new Date("2025-03-31"),
        amount: 75,
      }),
    ];

    const result = getActivityTypeTotalForMonth({
      monthDate: new Date("2025-03-01"),
      activityType: ActivityType.EXPENSE,
      activities,
    });

    expect(result).toBe(75);
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
        type: ActivityType.EXPENSE,
        project: "proj-1",
        amount: 120,
      }),
      makeActivity({
        id: "2",
        type: ActivityType.EXPENSE,
        project: "proj-1",
        amount: 80,
      }),
      makeActivity({
        id: "3",
        type: ActivityType.REVENUE,
        project: "proj-1",
        amount: 500,
      }),
      makeActivity({
        id: "4",
        type: ActivityType.EXPENSE,
        project: "proj-2",
        amount: 999,
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
        type: ActivityType.EXPENSE,
        project: "proj-1",
        amount: 50,
      }),
      makeActivity({
        id: "2",
        type: ActivityType.EXPENSE,
        project: "proj-2",
        amount: 300,
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
        type: ActivityType.EXPENSE,
        project: "proj-2",
        amount: 100,
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

describe("getActivityCategoryTotalForMonth", () => {
  it("sums activities of the right category in the target month", () => {
    const activities = [
      makeActivity({
        id: "1",
        category: "cat-food",
        date: new Date("2025-03-10"),
        amount: 40,
      }),
      makeActivity({
        id: "2",
        category: "cat-food",
        date: new Date("2025-03-25"),
        amount: 60,
      }),
      makeActivity({
        id: "3",
        category: "cat-rent",
        date: new Date("2025-03-01"),
        amount: 900,
      }),
    ];

    const result = getActivityCategoryTotalForMonth({
      monthDate: new Date("2025-03-01"),
      categoryId: "cat-food",
      activities,
    });

    expect(result).toBe(100);
  });

  it("excludes activities from the same category in a different month", () => {
    const activities = [
      makeActivity({
        id: "1",
        category: "cat-food",
        date: new Date("2025-03-10"),
        amount: 50,
      }),
      makeActivity({
        id: "2",
        category: "cat-food",
        date: new Date("2025-04-10"),
        amount: 999,
      }),
    ];

    const result = getActivityCategoryTotalForMonth({
      monthDate: new Date("2025-03-01"),
      categoryId: "cat-food",
      activities,
    });

    expect(result).toBe(50);
  });

  it("excludes activities from the same category and month in a different year", () => {
    const activities = [
      makeActivity({
        id: "1",
        category: "cat-food",
        date: new Date("2025-03-10"),
        amount: 50,
      }),
      makeActivity({
        id: "2",
        category: "cat-food",
        date: new Date("2024-03-10"),
        amount: 999,
      }),
    ];

    const result = getActivityCategoryTotalForMonth({
      monthDate: new Date("2025-03-01"),
      categoryId: "cat-food",
      activities,
    });

    expect(result).toBe(50);
  });

  it("includes an activity with a time component on the last day of the month", () => {
    // A date-range approach using new Date(year, month+1, 0) gives local midnight of
    // the last day (00:00:00.000), which wrongly excludes activities timestamped any
    // time after midnight on that day. The month+year comparison is not affected by
    // the time-of-day.
    const lastDayWithTime = new Date(2025, 2, 31, 14, 30, 0); // March 31 at 14:30 local
    const activities = [
      makeActivity({
        id: "1",
        category: "cat-food",
        date: lastDayWithTime,
        amount: 75,
      }),
    ];

    const result = getActivityCategoryTotalForMonth({
      monthDate: new Date("2025-03-01"),
      categoryId: "cat-food",
      activities,
    });

    expect(result).toBe(75);
  });

  it("returns 0 when no activities match the category", () => {
    const activities = [
      makeActivity({
        id: "1",
        category: "cat-rent",
        date: new Date("2025-03-10"),
        amount: 900,
      }),
    ];

    const result = getActivityCategoryTotalForMonth({
      monthDate: new Date("2025-03-01"),
      categoryId: "cat-food",
      activities,
    });

    expect(result).toBe(0);
  });

  it("returns 0 for an empty activity list", () => {
    const result = getActivityCategoryTotalForMonth({
      monthDate: new Date("2025-03-01"),
      categoryId: "cat-food",
      activities: [],
    });

    expect(result).toBe(0);
  });
});
