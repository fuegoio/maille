import superjson from "superjson";
import { beforeEach, describe, expect, it } from "vitest";

const persisted = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => persisted.get(key) ?? null,
  setItem: (key: string, value: string) => void persisted.set(key, value),
  removeItem: (key: string) => void persisted.delete(key),
} as unknown as Storage;
const { useViews, migrateViews } = await import("./views");
const { ACTIVITY_AMOUNT_FIELDS } =
  await import("@/components/activities/activity-view");

describe("persisted table views", () => {
  beforeEach(() => {
    persisted.clear();
    useViews.setState({
      activityViews: [],
      movementViews: [],
      transactionViews: [],
      fundMoveViews: [],
    });
  });

  it("migrates legacy views while preserving filters, ordering and hidden fields", () => {
    const filters = [{ field: "name", operator: "contains", value: "rent" }];
    const upgraded = migrateViews({
      activityViews: [
        {
          id: "activities",
          fields: ["name"],
          filters,
          showTransactions: true,
          grouping: "none",
          ordering: { field: "name", direction: "asc" },
        },
      ],
      movementViews: [{ id: "movements", filters }],
    });
    expect(upgraded.activityViews[0]).toMatchObject({
      fields: ["name", ...ACTIVITY_AMOUNT_FIELDS],
      filters,
      showTransactions: true,
      grouping: "none",
      ordering: { field: "name", direction: "asc" },
    });
    expect(upgraded.movementViews[0]).toMatchObject({
      filters,
      grouping: "period",
      ordering: { field: "date", direction: "desc" },
    });
    expect(upgraded.movementViews[0].fields).toContain("amount");
    expect(upgraded.transactionViews).toEqual([]);
    expect(upgraded.fundMoveViews).toEqual([]);
  });

  it("restores older records without any view configuration", async () => {
    persisted.set(
      "views",
      superjson.stringify({
        version: 0,
        state: {
          activityViews: [{ id: "old", filters: [] }],
          movementViews: [],
        },
      }),
    );
    await useViews.persist.rehydrate();
    expect(useViews.getState().getActivityView("old").fields).toContain(
      "amount:revenue",
    );
    expect(useViews.getState().getActivityView("old").showTransactions).toBe(
      false,
    );
  });

  it("preserves all hidden amount choices on rehydration", async () => {
    const state = useViews.getState();
    state.setActivityView("activities", {
      ...state.getActivityView("activities"),
      fields: ["name"],
      grouping: "type",
    });
    await useViews.persist.rehydrate();
    expect(useViews.getState().getActivityView("activities")).toMatchObject({
      fields: ["name"],
      grouping: "type",
    });
  });

  it("keeps per-table and per-account settings isolated with stable reads", () => {
    const state = useViews.getState();
    const transaction = state.getTransactionView("account-one");
    state.setTransactionView("account-one", {
      ...transaction,
      fields: ["name"],
      grouping: "fund",
    });
    expect(state.getTransactionView("account-two").grouping).toBe("period");
    expect(state.getFundMoveView("account-one").fields).toContain("amount");
    expect(state.getTransactionView("account-one")).toBe(
      state.getTransactionView("account-one"),
    );
    expect(state.getMovementView("movements")).toBe(
      state.getMovementView("movements"),
    );
  });

  it("migrates ignored month grouping defaults but preserves new explicit choices", async () => {
    const id = "month-9-2026-activities";
    const upgraded = migrateViews({
      activityViews: [
        {
          id,
          filters: [],
          fields: ["name"],
          grouping: "period",
          showTransactions: true,
        },
      ],
      movementViews: [],
    });
    expect(upgraded.activityViews[0]).toMatchObject({
      grouping: "none",
      showTransactions: true,
      fields: ["name", ...ACTIVITY_AMOUNT_FIELDS],
    });
    const state = useViews.getState();
    state.setActivityView(id, {
      ...state.getActivityView(id),
      grouping: "period",
    });
    await useViews.persist.rehydrate();
    expect(useViews.getState().getActivityView(id).grouping).toBe("period");
  });

  it("keeps month-detail views ungrouped initially", () => {
    expect(
      useViews.getState().getMovementView("month-9-2026-movements").grouping,
    ).toBe("none");
    expect(
      useViews.getState().getActivityView("month-9-2026-activities").grouping,
    ).toBe("none");
  });
});
