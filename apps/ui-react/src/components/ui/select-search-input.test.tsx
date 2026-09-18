import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SelectSearchInput } from "./select-search-input";

describe("select search input", () => {
  it("uses the category search row styling and icon", () => {
    const html = renderToStaticMarkup(<SelectSearchInput />);
    expect(html).toContain("rounded-none");
    expect(html).toContain("border-b");
    expect(html).toContain("border-t-0");
    expect(html).toContain("lucide-search");
    expect(html).toContain('placeholder="Search ..."');
    expect(html).toContain('aria-label="Search options"');
  });

  it("accepts an accessible field-specific label and controlled value", () => {
    const html = renderToStaticMarkup(
      <SelectSearchInput
        aria-label="Search filter values"
        value="food"
        onChange={() => {}}
      />,
    );
    expect(html).toContain('aria-label="Search filter values"');
    expect(html).toContain('value="food"');
  });

  it("lets padded menus extend the row to their edges", () => {
    const html = renderToStaticMarkup(
      <SelectSearchInput groupClassName="-mx-1 w-auto" />,
    );
    expect(html).toContain("-mx-1");
    expect(html).toContain("w-auto");
  });

  it("preserves input options without turning the icon into a tab stop", () => {
    const html = renderToStaticMarkup(
      <SelectSearchInput disabled placeholder="Find a category" />,
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('placeholder="Find a category"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<button");
  });
});
