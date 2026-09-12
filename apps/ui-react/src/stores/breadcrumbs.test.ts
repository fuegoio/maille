import { beforeEach, describe, expect, it } from "vitest";

import {
  captureBreadcrumbContext,
  commitBreadcrumbs,
  resetBreadcrumbs,
  resolveBreadcrumbs,
  useBreadcrumbsStore,
  type BreadcrumbEntry,
} from "./breadcrumbs";

const accountsEntry: BreadcrumbEntry = {
  key: "accounts",
  label: "Accounts",
  target: { to: "/accounts" },
};
const accountEntry: BreadcrumbEntry = {
  key: "account:1",
  label: "Bank",
  target: { to: "/accounts/$id", params: { id: "1" } },
};
const movementsTabEntry: BreadcrumbEntry = {
  key: "tab:movements",
  label: "Movements",
  target: {
    to: "/accounts/$id",
    params: { id: "1" },
    search: { tab: "movements" },
  },
};
const movementsIndexEntry: BreadcrumbEntry = {
  key: "movements",
  label: "Movements",
  target: { to: "/movements" },
};

const accountPage = {
  contextual: false as const,
  routeKey: "/accounts/$id",
  entries: [accountsEntry, accountEntry, movementsTabEntry],
};

const movementPage = {
  contextual: true as const,
  routeKey: "/movements/$id",
  own: {
    key: "movement:m1",
    label: "Groceries",
    target: { to: "/movements/$id", params: { id: "m1" } },
  },
  fallback: [movementsIndexEntry],
};

function entries(
  page: Parameters<typeof resolveBreadcrumbs>[0],
  entryKey?: string,
) {
  return resolveBreadcrumbs(page, entryKey).entries;
}

describe("breadcrumb trails", () => {
  beforeEach(() => {
    resetBreadcrumbs();
  });

  it("renders the declared trail of a static page", () => {
    expect(entries(accountPage)).toEqual([
      accountsEntry,
      accountEntry,
      movementsTabEntry,
    ]);
  });

  it("falls back to the default chain on direct entry", () => {
    expect(entries(movementPage, "k1")).toEqual([
      movementsIndexEntry,
      movementPage.own,
    ]);
  });

  it("uses the context captured by the opening link", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/movements/$id");

    expect(entries(movementPage, "k2")).toEqual([
      accountsEntry,
      accountEntry,
      movementsTabEntry,
      movementPage.own,
    ]);
  });

  it("ignores context captured for another route", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/activities/$id");

    expect(entries(movementPage, "k2")).toEqual([
      movementsIndexEntry,
      movementPage.own,
    ]);
  });

  it("keeps captured context when the source page re-commits mid-navigation", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/movements/$id");

    // The source page stays mounted until the target route is ready, and
    // its breadcrumb effect runs again in between.
    commitBreadcrumbs(accountPage, "k1");

    expect(useBreadcrumbsStore.getState().pending).toEqual({
      routeKey: "/movements/$id",
      context: [accountsEntry, accountEntry, movementsTabEntry],
    });
    expect(entries(movementPage, "k2")).toEqual([
      accountsEntry,
      accountEntry,
      movementsTabEntry,
      movementPage.own,
    ]);
  });

  it("keeps the context when navigating between pages of the same route", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/movements/$id");
    commitBreadcrumbs(movementPage, "k2");

    const nextMovement = {
      ...movementPage,
      own: {
        key: "movement:m2",
        label: "Rent",
        target: { to: "/movements/$id", params: { id: "m2" } },
      },
    };
    expect(entries(nextMovement, "k3")).toEqual([
      accountsEntry,
      accountEntry,
      movementsTabEntry,
      nextMovement.own,
    ]);
  });

  it("restores the context when returning to a history entry", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/movements/$id");
    commitBreadcrumbs(movementPage, "k2");

    commitBreadcrumbs(
      {
        contextual: false,
        routeKey: "/movements",
        entries: [movementsIndexEntry],
      },
      "k3",
    );

    // Browser back to the movement's history entry.
    expect(entries(movementPage, "k2")).toEqual([
      accountsEntry,
      accountEntry,
      movementsTabEntry,
      movementPage.own,
    ]);
  });

  it("consumes the pending context when committing", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/movements/$id");
    commitBreadcrumbs(movementPage, "k2");

    expect(useBreadcrumbsStore.getState().pending).toBeNull();
  });

  it("drops stale context when a static page commits", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/movements/$id");
    commitBreadcrumbs(
      { contextual: false, routeKey: "/accounts", entries: [accountsEntry] },
      "k2",
    );

    expect(useBreadcrumbsStore.getState().pending).toBeNull();
  });

  it("prunes remembered contexts beyond the cap", () => {
    commitBreadcrumbs(accountPage, "k1");
    captureBreadcrumbContext("/movements/$id");
    commitBreadcrumbs(movementPage, "k2");

    const state = useBreadcrumbsStore.getState();
    expect(state.contexts.get("k2")).toEqual([
      accountsEntry,
      accountEntry,
      movementsTabEntry,
    ]);
  });
});
