import { ListFilter } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CheckboxIndicator } from "@/components/ui/checkbox";

import type { FilterShape } from "./filter-picker-state";

import {
  FilterValueSummary,
  type FilterFieldDefinition,
} from "./filter-field-editor";

const field: FilterFieldDefinition<FilterShape> = {
  value: "status",
  text: "Status",
  icon: ListFilter,
  operators: ["is any of"],
  input: {
    type: "multiple",
    pluralLabel: "statuses",
    options: [
      { value: "scheduled", label: "Scheduled" },
      { value: "completed", label: "Completed" },
    ],
  },
};

describe("shared filter values", () => {
  it("uses the same option labels in chips as in the value editor", () => {
    expect(
      renderToStaticMarkup(
        <FilterValueSummary field={field} value={["scheduled"]} />,
      ),
    ).toContain("Scheduled");
  });
  it("summarizes all selected values rather than just the first status", () => {
    expect(
      renderToStaticMarkup(
        <FilterValueSummary field={field} value={["scheduled", "completed"]} />,
      ),
    ).toContain("2 statuses");
  });
  it("keeps missing options visible instead of leaving an empty chip", () => {
    expect(
      renderToStaticMarkup(
        <FilterValueSummary field={field} value={["deleted"]} />,
      ),
    ).toContain("Unavailable value");
  });
  it("shows zero as a value", () => {
    expect(
      renderToStaticMarkup(
        <FilterValueSummary
          field={{ ...field, input: { type: "number" } }}
          value={0}
        />,
      ),
    ).toContain(">0</span>");
  });
  it("shows single-choice labels without an array", () => {
    const single = {
      ...field,
      input: {
        type: "single" as const,
        options: [{ value: "in", label: "In" }],
      },
    };
    expect(
      renderToStaticMarkup(<FilterValueSummary field={single} value="in" />),
    ).toContain(">In</span>");
  });
  it.each([false, true])(
    "renders a visible checkbox without a nested interactive control (checked=%s)",
    (checked) => {
      const html = renderToStaticMarkup(
        <CheckboxIndicator checked={checked} />,
      );
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain(
        'data-state="' + (checked ? "checked" : "unchecked") + '"',
      );
      expect(html).toContain("border-input");
      expect(html).not.toContain("<button");
      expect(html.includes("<svg")).toBe(checked);
    },
  );
});
