import { describe, expect, it } from "vitest";

import { matchesDateTolerance } from "./link-date-filter";

describe("matchesDateTolerance", () => {
  const reference = new Date(2026, 8, 11); // September 11, 2026

  it("matches the same calendar day for every tolerance", () => {
    const sameDay = new Date(2026, 8, 11, 23, 30);
    expect(matchesDateTolerance(sameDay, reference, 0)).toBe(true);
    expect(matchesDateTolerance(sameDay, reference, 1)).toBe(true);
    expect(matchesDateTolerance(sameDay, reference, 2)).toBe(true);
  });

  it("uses calendar days, not 24h periods", () => {
    const lateNextDay = new Date(2026, 8, 12, 1, 0); // 25h later, next calendar day
    expect(matchesDateTolerance(lateNextDay, reference, 1)).toBe(true);
    expect(matchesDateTolerance(lateNextDay, reference, 0)).toBe(false);
  });

  it("accepts days before the reference date", () => {
    expect(matchesDateTolerance(new Date(2026, 8, 10), reference, 1)).toBe(
      true,
    );
    expect(matchesDateTolerance(new Date(2026, 8, 9), reference, 2)).toBe(true);
    expect(matchesDateTolerance(new Date(2026, 8, 9), reference, 1)).toBe(
      false,
    );
  });

  it("rejects dates beyond the tolerance", () => {
    expect(matchesDateTolerance(new Date(2026, 8, 14), reference, 2)).toBe(
      false,
    );
    expect(matchesDateTolerance(new Date(2026, 8, 12), reference, 0)).toBe(
      false,
    );
    expect(matchesDateTolerance(new Date(2026, 7, 11), reference, 2)).toBe(
      false,
    );
  });
});
