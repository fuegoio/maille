import type { ActivityFilter } from "#activities/types.ts";
import type { MovementFilter } from "#movements/types.ts";

/** The kind of rows a custom view displays. */
export type ViewResource = "activities" | "movements" | "transactions";

/** Sort direction of a view's rows. */
export type ViewDirection = "asc" | "desc";

/** How the rows of a view are ordered. */
export type ViewOrdering = {
  field: string;
  direction: ViewDirection;
};

/**
 * Where a custom view is attached: a page's tab bar, one month, one
 * account or one fund (null is Untracked). The scope decides which
 * fixed tabs the view sits next to and which base data it displays.
 */
export type ViewScope =
  | {
      kind: "page";
      page: "activities" | "movements" | "categories" | "projects" | "funds";
    }
  | { kind: "month"; month: number; year: number }
  | { kind: "account"; accountId: string }
  | { kind: "fund"; fundId: string | null };

/** A scope as stored in the API and sync events: a single string. */
export function serializeViewScope(scope: ViewScope): string {
  switch (scope.kind) {
    case "page":
      return `page:${scope.page}`;
    case "month":
      return `month:${scope.year}-${String(scope.month).padStart(2, "0")}`;
    case "account":
      return `account:${scope.accountId}`;
    case "fund":
      return `fund:${scope.fundId ?? "untracked"}`;
  }
}

export function deserializeViewScope(scope: string): ViewScope | null {
  const [kind, value] = scope.split(":");
  if (kind === "page") {
    if (
      value === "activities" ||
      value === "movements" ||
      value === "categories" ||
      value === "projects" ||
      value === "funds"
    ) {
      return { kind: "page", page: value };
    }
    return null;
  }
  if (kind === "month") {
    if (value === undefined) return null;
    const parts = value.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
    return { kind: "month", month, year };
  }
  if (kind === "account" && value !== undefined) {
    return { kind: "account", accountId: value };
  }
  if (kind === "fund") {
    if (value === undefined || value === "untracked") {
      return { kind: "fund", fundId: null };
    }
    return { kind: "fund", fundId: value };
  }
  return null;
}

/** A filter on the rows of a transactions view. */
export type TransactionFilter =
  | { field: "date"; operator: "before" | "after"; value?: string }
  | {
      field: "amount";
      operator: "less" | "less or equal" | "equal" | "not equal" | "greater or equal" | "greater";
      value?: number;
    }
  | { field: "direction"; operator: "is" | "is not"; value?: "in" | "out" }
  | {
      field: "status";
      operator: "is any of" | "is not";
      value?: string[];
    };

/** The transactions view's filterable fields, in menu order. */
export const TransactionFilterFields: {
  value: TransactionFilter["field"];
  text: string;
}[] = [
  { value: "date", text: "Date" },
  { value: "amount", text: "Amount" },
  { value: "direction", text: "Direction" },
  { value: "status", text: "Status" },
];

/** A view's settings and filters; the resource decides the filter shape. */
export type ViewConfig =
  | {
      resource: "activities";
      /** Visible field ids, in display order. */
      fields: string[];
      ordering: ViewOrdering;
      grouping: string;
      /** Whether activity rows can expand to their transactions. */
      showTransactions: boolean;
      filters: ActivityFilter[];
    }
  | {
      resource: "movements";
      fields: string[];
      ordering: ViewOrdering;
      grouping: string;
      filters: MovementFilter[];
    }
  | {
      resource: "transactions";
      fields: string[];
      ordering: ViewOrdering;
      grouping: string;
      filters: TransactionFilter[];
    };

/**
 * A user-defined view: a named bundle of settings and filters over one
 * resource, attached to a scope. Stored in the API so it is restorable
 * and shared across sessions.
 */
export type View = {
  id: string;
  name: string;
  scope: string;
  config: ViewConfig;
  createdAt: string;
};

/** Parse a stored config, mapping "resource" into the config union. */
export function parseViewConfig(resource: ViewResource, parsed: unknown): ViewConfig {
  const config = (parsed ?? {}) as Omit<ViewConfig, "resource">;
  return { resource, ...config } as ViewConfig;
}
