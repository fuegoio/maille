import { describe, expect, it } from "vitest";

import {
  isEmptyFilterValue,
  replacePickerFilter,
  resolveFilterUpdate,
  toggleFilterValue,
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

describe("shared filter editing", () => {
  const category: FilterShape = {
    field: "category",
    operator: "is any of",
    value: ["food"],
  };
  const presenceOperators = ["is defined", "is not defined"];

  it("keeps multiple selections in one array and toggles each independently", () => {
    const both = toggleFilterValue(category.value, "transport");
    expect(both).toEqual(["food", "transport"]);
    expect(toggleFilterValue(both, "food")).toEqual(["transport"]);
    expect(toggleFilterValue(["food"], "food")).toEqual([]);
    expect(category.value).toEqual(["food"]);
  });

  it("starts an empty checkbox selection", () => {
    expect(toggleFilterValue(undefined, "food")).toEqual(["food"]);
  });

  it("keeps incomplete operator changes local in both entry points", () => {
    const pending = { field: "category", operator: "is not defined" };
    expect(
      resolveFilterUpdate(pending, { operator: "is any of" }, presenceOperators)
        .saved,
    ).toBeUndefined();
  });

  it("clears stale values when switching to a presence operator", () => {
    const result = resolveFilterUpdate(
      category,
      { operator: "is not defined" },
      presenceOperators,
    );
    expect(result.saved).toEqual({
      field: "category",
      operator: "is not defined",
      value: undefined,
    });
    expect(
      resolveFilterUpdate(
        result.pending,
        { operator: "is any of" },
        presenceOperators,
      ).saved,
    ).toBeUndefined();
  });

  it("removes the filter when the last checkbox is unchecked", () => {
    expect(resolveFilterUpdate(category, { value: [] }).saved).toBeNull();
  });

  it("saves complete changes without changing sibling filters", () => {
    expect(
      resolveFilterUpdate(category, { value: ["food", "transport"] }).saved,
    ).toEqual({ ...category, value: ["food", "transport"] });
    expect(category.value).toEqual(["food"]);
  });

  it("keeps single-choice values scalar", () => {
    expect(
      resolveFilterUpdate(
        { field: "direction", operator: "is", value: "in" },
        { value: "out" },
      ).saved?.value,
    ).toBe("out");
  });

  it("allows zero in the shared amount editor", () => {
    expect(
      resolveFilterUpdate({ field: "amount", operator: "equal" }, {
        value: 0,
      } as Partial<FilterShape>).saved,
    ).toEqual({ field: "amount", operator: "equal", value: 0 });
  });
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
