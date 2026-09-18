import { describe, expect, it } from "vitest";

import {
  isEmptyFilterValue,
  replacePickerFilter,
  type FilterShape,
} from "./filter-picker-state";

describe("filter picker values", () => {
  it.each([undefined, null, "", "  ", [], NaN, Infinity, -Infinity])(
    "rejects an empty or invalid value: %s",
    (value) => {
      expect(isEmptyFilterValue(value)).toBe(true);
    },
  );

  it.each([0, -2.5, "rent", ["food"]])(
    "accepts a value carrying a constraint: %s",
    (value) => {
      expect(isEmptyFilterValue(value)).toBe(false);
    },
  );
});

describe("filter picker updates", () => {
  const food: FilterShape = {
    field: "category",
    operator: "is any of",
    value: ["food"],
  };

  it("updates rather than duplicates a filter after an API JSON round trip", () => {
    let filters: FilterShape[] = JSON.parse(JSON.stringify([food]));
    const selected = { ...food, value: ["food", "transport"] };
    filters = replacePickerFilter(filters, "category", selected);
    filters = JSON.parse(JSON.stringify(filters));
    filters = replacePickerFilter(filters, "category", food);
    expect(filters).toEqual([food]);
  });

  it("removes the filter when its last value is unchecked", () => {
    const other = { field: "amount", operator: "equal", value: 0 };
    expect(replacePickerFilter([food, other], "category", null)).toEqual([
      other,
    ]);
  });

  it("does not notify a store for opening or cancelling an empty field", () => {
    const filters = [food];
    expect(replacePickerFilter(filters, "amount", null)).toBe(filters);
  });

  it("does not notify a store for reapplying the same complete filter", () => {
    const filters = [food];
    expect(replacePickerFilter(filters, "category", { ...food })).toBe(filters);
  });

  it("preserves unrelated filters and the other bound of a date range", () => {
    const before = { field: "date", operator: "before", value: "today" };
    const after = { field: "date", operator: "after", value: "1 month ago" };
    const next = { ...after, value: "1 week ago" };
    expect(replacePickerFilter([food, before, after], "date", next)).toEqual([
      food,
      before,
      next,
    ]);
  });
});
