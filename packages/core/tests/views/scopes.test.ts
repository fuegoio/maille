import { describe, expect, it } from "bun:test";

import {
  deserializeViewScope,
  serializeViewScope,
  verifyTransactionFilter,
  type ViewScope,
} from "#views/index.ts";

describe("view scopes", () => {
  it("round-trips every scope kind", () => {
    const scopes: ViewScope[] = [
      { kind: "page", page: "activities" },
      { kind: "page", page: "movements" },
      { kind: "month", month: 9, year: 2026 },
      { kind: "month", month: 12, year: 2026 },
      { kind: "account", accountId: "acc-12345678" },
      { kind: "fund", fundId: "fund-12345678" },
      { kind: "fund", fundId: null },
      { kind: "category", categoryId: "cat-12345678" },
      { kind: "project", projectId: "prj-12345678" },
    ];

    for (const scope of scopes) {
      expect(deserializeViewScope(serializeViewScope(scope))).toEqual(scope);
    }
  });

  it("rejects unknown scopes", () => {
    expect(deserializeViewScope("unknown:thing")).toBe(null);
    expect(deserializeViewScope("page:nope")).toBe(null);
  });
});

describe("transaction filters", () => {
  const row = {
    date: new Date("2026-09-10T12:00:00Z"),
    amount: 100,
    direction: "in" as const,
    status: "completed",
  };

  it("filters by amount operators", () => {
    expect(verifyTransactionFilter({ field: "amount", operator: "greater", value: 50 }, row)).toBe(
      true,
    );
    expect(verifyTransactionFilter({ field: "amount", operator: "less", value: 50 }, row)).toBe(
      false,
    );
  });

  it("filters by direction", () => {
    expect(verifyTransactionFilter({ field: "direction", operator: "is", value: "in" }, row)).toBe(
      true,
    );
    expect(
      verifyTransactionFilter({ field: "direction", operator: "is not", value: "in" }, row),
    ).toBe(false);
  });

  it("filters by status", () => {
    expect(
      verifyTransactionFilter(
        { field: "status", operator: "is any of", value: ["completed"] },
        row,
      ),
    ).toBe(true);
    expect(
      verifyTransactionFilter({ field: "status", operator: "is not", value: ["completed"] }, row),
    ).toBe(false);
  });

  it("keeps rows when the filter has no value yet", () => {
    expect(verifyTransactionFilter({ field: "amount", operator: "greater" }, row)).toBe(true);
  });

  it("filters by date presets relative to now", () => {
    const now = new Date("2026-09-18T12:00:00Z");
    const oldRow = { ...row, date: new Date("2026-09-10T12:00:00Z") };
    expect(
      verifyTransactionFilter(
        { field: "date", operator: "before", value: "1 week ago" },
        oldRow,
        now,
      ),
    ).toBe(true);
    expect(
      verifyTransactionFilter(
        { field: "date", operator: "after", value: "1 week ago" },
        oldRow,
        now,
      ),
    ).toBe(false);
  });
});
