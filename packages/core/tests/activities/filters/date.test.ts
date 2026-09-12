import { describe, expect, test } from "vitest";

import {
  ActivityFilterDateOperators,
  ActivityFilterDateValues,
  ActivityType,
  type Activity,
} from "@maille/core/activities";

import { verifyActivityFilter } from "@maille/core/activities";

describe("date filters on activity", () => {
  type DateTestCase = {
    date: string;
    activityDate: string;
    operator: (typeof ActivityFilterDateOperators)[number];
    value: (typeof ActivityFilterDateValues)[number];
    expected: boolean;
  };

  // Parse "YYYY-MM-DD" as a local-time midnight date: the filter compares
  // dates on the startOfDay() basis, so the test must be timezone-stable.
  const localDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year!, month! - 1, day!);
  };

  (
    [
      {
        date: "2023-04-01",
        activityDate: "2023-04-01",
        operator: "before",
        value: "1 day ago",
        expected: false,
      },
      {
        date: "2023-04-02",
        activityDate: "2023-04-01",
        operator: "before",
        value: "1 day ago",
        expected: true,
      },
      {
        date: "2023-03-31",
        activityDate: "2023-04-01",
        operator: "before",
        value: "1 day ago",
        expected: false,
      },
      {
        date: "2023-04-02",
        activityDate: "2023-04-01",
        operator: "after",
        value: "1 day ago",
        expected: true,
      },
      {
        date: "2023-04-01",
        activityDate: "2023-04-01",
        operator: "after",
        value: "1 day ago",
        expected: true,
      },
      {
        date: "2023-04-03",
        activityDate: "2023-04-01",
        operator: "after",
        value: "1 day ago",
        expected: false,
      },
    ] as DateTestCase[]
  ).forEach((testCase) => {
    const activity: Activity = {
      id: "0",
      name: "test activity",
      description: "test",
      date: localDate(testCase.activityDate),
      types: [ActivityType.EXPENSE],
      amounts: {
        [ActivityType.EXPENSE]: 10,
        [ActivityType.REVENUE]: 0,
        [ActivityType.INVESTMENT]: 0,
        [ActivityType.NEUTRAL]: 0,
      },
      category: null,
      subcategory: null,
      project: null,
      amount: 10,
      transactions: [],
      movements: [],
      sharing: [],
      status: "completed",
      history: [],
    };

    test(`${testCase.activityDate} ${testCase.operator} ${testCase.value} of ${testCase.date} should be ${testCase.expected}`, () => {
      expect(
        verifyActivityFilter(
          { field: "date", operator: testCase.operator, value: testCase.value },
          activity,
          localDate(testCase.date),
        ),
      ).toBe(testCase.expected);
    });
  });
});
