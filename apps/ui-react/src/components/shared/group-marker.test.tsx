import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { GroupMarker as GroupMarkerData } from "@/lib/view-grouping";

// The existing color maps live beside the persisted stores.
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} as unknown as Storage;
const { GroupMarker } = await import("./group-marker");
const { TableGroupHeader } = await import("./table-group-header");

const render = (marker: GroupMarkerData) =>
  renderToStaticMarkup(<GroupMarker marker={marker} />);

describe("group identity marks", () => {
  it("renders user emoji as text, without changing the accessible group name", () => {
    const html = render({ kind: "emoji", value: "\u{1F6D2}" });
    expect(html).toContain("\u{1F6D2}");
    expect(html).toContain('aria-hidden="true"');
  });

  it("reuses account colors and fund swatches", () => {
    expect(
      render({ kind: "account", type: AccountType.BANK_ACCOUNT }),
    ).toContain("bg-account-bank");
    const fund = render({ kind: "fund", color: "#336699" });
    expect(fund).toContain("background-color:#336699");
    expect(fund).toContain("rounded-sm");
  });

  it("distinguishes status, direction, and mixed types", () => {
    expect(render({ kind: "status", value: "completed" })).toContain(
      "lucide-circle-check",
    );
    expect(render({ kind: "status", value: "incomplete" })).toContain(
      "text-warning",
    );
    expect(render({ kind: "direction", value: "in" })).toContain(
      "lucide-arrow-down-left",
    );
    expect(render({ kind: "direction", value: "out" })).toContain(
      "lucide-arrow-up-right",
    );
    const types = render({
      kind: "types",
      values: [ActivityType.REVENUE, ActivityType.EXPENSE],
    });
    expect(types).toContain("bg-activity-revenue");
    expect(types).toContain("bg-activity-expense");
  });

  it("provides distinct fallback marks for untracked and mixed funds", () => {
    expect(render({ kind: "icon", name: "untracked" })).toContain(
      "lucide-circle-dashed",
    );
    expect(render({ kind: "icon", name: "mixed-funds" })).toContain(
      "lucide-layers",
    );
  });

  it("renders category ancestry, collapse semantics, count and totals together", () => {
    const html = renderToStaticMarkup(
      <TableGroupHeader
        id="group:subcategory:groceries"
        label="Groceries"
        folded={false}
        onToggle={() => {}}
        count={3}
        parent={{
          label: "Food",
          marker: { kind: "emoji", value: "\u{1F37D}" },
        }}
        marker={{ kind: "emoji", value: "\u{1F6D2}" }}
      >
        123.45
      </TableGroupHeader>,
    );
    expect(html).toContain('aria-label="Collapse Food / Groceries"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("lucide-chevron-right");
    expect(html).toContain('aria-label="3 rows"');
    expect(html).toContain("123.45");
    expect(html.indexOf("Food</span>")).toBeLessThan(
      html.indexOf("Groceries</span>"),
    );
  });
});
