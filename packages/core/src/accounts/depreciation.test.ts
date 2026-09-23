import { describe, expect, it } from "vitest";

import {
  addMonths,
  depreciationActivityName,
  depreciationInstallments,
  depreciationMonthKey,
  firstOfMonth,
  isDepreciationManaged,
} from "./depreciation";

describe("depreciationInstallments", () => {
  it("spreads the basis evenly, one installment on the 1st of each month", () => {
    const installments = depreciationInstallments({
      basis: 1200,
      months: 24,
      startMonth: firstOfMonth(2026, 3),
    });

    expect(installments).toHaveLength(24);
    expect(installments[0]).toEqual({
      date: firstOfMonth(2026, 3),
      amount: 50,
    });
    // Year rollover lands on the 1st of the next year's month
    expect(installments[9]!.date.toISOString()).toBe(firstOfMonth(2027, 0).toISOString());
    expect(installments[23]!.date.toISOString()).toBe(firstOfMonth(2028, 2).toISOString());
    expect(installments.every((i) => i.date.getUTCDate() === 1)).toBe(true);
  });
});

describe("addMonths", () => {
  it("rolls over year boundaries", () => {
    expect(addMonths(firstOfMonth(2026, 11), 2).toISOString()).toBe(
      firstOfMonth(2027, 1).toISOString(),
    );
  });
});

describe("depreciationMonthKey", () => {
  it("keys dates by their month", () => {
    expect(depreciationMonthKey(firstOfMonth(2026, 3))).toBe("2026-04");
  });
});

describe("isDepreciationManaged", () => {
  it("keeps today and the future managed, and the past frozen", () => {
    const now = new Date(2026, 8, 23, 15, 30);
    expect(isDepreciationManaged(new Date(2026, 8, 23), now)).toBe(true);
    expect(isDepreciationManaged(firstOfMonth(2026, 9), now)).toBe(true);
    expect(isDepreciationManaged(firstOfMonth(2026, 8), now)).toBe(false);
  });
});

describe("depreciationActivityName", () => {
  it("names the activity after its asset", () => {
    expect(depreciationActivityName("MacBook")).toBe("Depreciation — MacBook");
  });
});
