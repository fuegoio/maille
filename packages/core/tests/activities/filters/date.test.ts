import { describe, expect, test, vi } from "vitest";
import dayjs from "dayjs";

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
      id: 0,
      activity: {
        id: 0,
        user: "user",
        number: 1,
        name: "test activity",
        description: "test",
        date: dayjs(testCase.activityDate),
        type: ActivityType.EXPENSE,
        category: 0,
        subcategory: 0,
        project: null,
      },
      amount: 10,
      transactions: [],
      status: "completed",
    };

    test(`${testCase.activityDate} ${testCase.operator} ${testCase.value} of ${testCase.date} should be ${testCase.expected}`, () => {
      vi.useFakeTimers();

      vi.setSystemTime(testCase.date);
      expect(
        verifyActivityFilter(
          { field: "date", operator: testCase.operator, value: testCase.value },
          activity,
        ),
      ).toBe(testCase.expected);

      vi.useRealTimers();
    });
  });
});
