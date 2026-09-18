import { beforeEach, describe, expect, it } from "vitest";

const persisted = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => persisted.get(key) ?? null,
  setItem: (key: string, value: string) => void persisted.set(key, value),
  removeItem: (key: string) => void persisted.delete(key),
} as unknown as Storage;

const { useCustomViews } = await import("./customViews");

const activityConfig = {
  resource: "activities" as const,
  fields: ["date", "name"],
  ordering: { field: "date", direction: "desc" as const },
  grouping: "none",
  showTransactions: false,
  filters: [],
};

const event = (type: string, payload: unknown) =>
  ({
    type,
    payload,
    user: "user-1",
    clientId: "session-1",
    createdAt: new Date(),
  }) as never;

describe("custom views store", () => {
  beforeEach(() => {
    persisted.clear();
    useCustomViews.setState({ views: [] });
  });

  it("applies createView events by parsing the config", () => {
    useCustomViews.getState().handleEvent(
      event("createView", {
        id: "view-1",
        name: "Rent",
        scope: "page:activities",
        resource: "activities",
        config: JSON.stringify(activityConfig),
      }),
    );

    const view = useCustomViews
      .getState()
      .views.find((entry) => entry.id === "view-1");
    expect(view).toMatchObject({
      id: "view-1",
      name: "Rent",
      scope: "page:activities",
      config: activityConfig,
    });
  });

  it("ignores createView events for views it already has", () => {
    const create = () =>
      useCustomViews.getState().handleEvent(
        event("createView", {
          id: "view-1",
          name: "Rent",
          scope: "page:activities",
          resource: "activities",
          config: JSON.stringify(activityConfig),
        }),
      );
    create();
    create();

    expect(useCustomViews.getState().views).toHaveLength(1);
  });

  it("applies updateView events to the name and the config", () => {
    useCustomViews.getState().handleEvent(
      event("createView", {
        id: "view-1",
        name: "Rent",
        scope: "page:activities",
        resource: "activities",
        config: JSON.stringify(activityConfig),
      }),
    );

    useCustomViews.getState().handleEvent(
      event("updateView", {
        id: "view-1",
        name: "Housing",
        config: JSON.stringify({
          ...activityConfig,
          filters: [{ field: "name", operator: "is", value: "rent" }],
        }),
      }),
    );

    const view = useCustomViews
      .getState()
      .views.find((entry) => entry.id === "view-1");
    expect(view?.name).toBe("Housing");
    expect(view?.config).toMatchObject({
      resource: "activities",
      filters: [{ field: "name", operator: "is", value: "rent" }],
    });
  });

  it("applies deleteView events", () => {
    useCustomViews.getState().handleEvent(
      event("createView", {
        id: "view-1",
        name: "Rent",
        scope: "page:activities",
        resource: "activities",
        config: JSON.stringify(activityConfig),
      }),
    );
    useCustomViews
      .getState()
      .handleEvent(event("deleteView", { id: "view-1" }));

    expect(useCustomViews.getState().views).toHaveLength(0);
  });

  it("drops deleted categories from view filters", () => {
    useCustomViews.getState().handleEvent(
      event("createView", {
        id: "view-1",
        name: "Rent",
        scope: "page:activities",
        resource: "activities",
        config: JSON.stringify({
          ...activityConfig,
          filters: [
            {
              field: "category",
              operator: "is any of",
              value: ["cat-1", "cat-2"],
            },
          ],
        }),
      }),
    );

    useCustomViews
      .getState()
      .handleEvent(event("deleteActivityCategory", { id: "cat-1" }));

    const view = useCustomViews
      .getState()
      .views.find((entry) => entry.id === "view-1");
    expect(view?.config.filters).toEqual([
      { field: "category", operator: "is any of", value: ["cat-2"] },
    ]);
  });

  it("returns the views of one scope", () => {
    useCustomViews.getState().handleEvent(
      event("createView", {
        id: "view-1",
        name: "Rent",
        scope: "page:activities",
        resource: "activities",
        config: JSON.stringify(activityConfig),
      }),
    );
    useCustomViews.getState().handleEvent(
      event("createView", {
        id: "view-2",
        name: "Month view",
        scope: "month:2026-09",
        resource: "activities",
        config: JSON.stringify(activityConfig),
      }),
    );

    expect(
      useCustomViews
        .getState()
        .getScopeViews("page:activities")
        .map((v) => v.id),
    ).toEqual(["view-1"]);
  });

  it("rolls back a failed create by removing the view", () => {
    useCustomViews.getState().handleEvent(
      event("createView", {
        id: "view-1",
        name: "Rent",
        scope: "page:activities",
        resource: "activities",
        config: JSON.stringify(activityConfig),
      }),
    );

    useCustomViews.getState().handleMutationError({
      name: "createView",
      variables: { id: "view-1" },
      rollbackData: undefined,
    } as never);

    expect(useCustomViews.getState().views).toHaveLength(0);
  });

  it("rolls back a failed delete by restoring the view", () => {
    const view = {
      id: "view-1",
      name: "Rent",
      scope: "page:activities",
      config: activityConfig,
      createdAt: new Date().toISOString(),
    };
    useCustomViews.setState({ views: [view] });

    useCustomViews.getState().handleMutationError({
      name: "deleteView",
      variables: { id: "view-1" },
      rollbackData: view,
    } as never);

    expect(useCustomViews.getState().views).toHaveLength(1);
  });
});
