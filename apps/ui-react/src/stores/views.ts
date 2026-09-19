import type { ActivityFilter } from "@maille/core/activities";
import type { MovementFilter } from "@maille/core/movements";
import type { TransactionFilter } from "@maille/core/views";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ViewConfig } from "@/types/views";

import {
  ACTIVITY_AMOUNT_FIELDS,
  ACTIVITY_VIEW_FIELDS,
} from "@/components/activities/activity-view";
import { MOVEMENT_VIEW_FIELDS } from "@/components/movements/movement-view";
import { TRANSACTION_VIEW_FIELDS } from "@/components/transactions/transaction-view";

import { storage } from "./storage";

/**
 * An activity view is the generic view configuration (fields, ordering,
 * grouping) plus the activity's own options and filters.
 */
type ActivityView = ViewConfig & {
  id: string;
  showTransactions: boolean;
  filters: ActivityFilter[];
};

type TableView = ViewConfig & { id: string; filters: TransactionFilter[] };

type MovementView = ViewConfig & {
  id: string;
  filters: MovementFilter[];
};

/** The configuration a new activity view starts from. */
function defaultActivityView(viewId: string): ActivityView {
  return {
    id: viewId,
    showTransactions: false,
    filters: [],
    fields: [...ACTIVITY_VIEW_FIELDS],
    ordering: { field: "date", direction: "desc" },
    grouping: viewId.startsWith("month-") ? "none" : "period",
  };
}

function defaultTableView(
  viewId: string,
  fields: readonly string[],
): TableView {
  return {
    id: viewId,
    fields: [...fields],
    ordering: { field: "date", direction: "desc" },
    grouping: viewId.startsWith("month-") ? "none" : "period",
    filters: [],
  };
}

function isLegacyView(view: Partial<ViewConfig>): boolean {
  return (
    view.fields === undefined ||
    view.ordering === undefined ||
    view.grouping === undefined
  );
}

/** Upgrade old saved views without resetting filters or explicit field choices. */
export function migrateViews(persisted: unknown) {
  // Fund move views were folded into transaction views; the stale key
  // is dropped so it never comes back on rehydration.
  const { fundMoveViews: _dropped, ...state } = (persisted ??
    {}) as Partial<ViewsState> & { fundMoveViews?: unknown };
  return {
    ...state,
    activityViews: (state.activityViews ?? []).map((view) => ({
      ...defaultActivityView(view.id),
      ...view,
      // Month pages previously ignored their persisted period default.
      grouping: view.id.startsWith("month-")
        ? "none"
        : (view.grouping ?? "period"),
      fields: [
        ...new Set([
          ...(view.fields ?? ACTIVITY_VIEW_FIELDS),
          ...ACTIVITY_AMOUNT_FIELDS,
        ]),
      ],
    })),
    movementViews: (state.movementViews ?? []).map((view) => ({
      ...defaultTableView(view.id, MOVEMENT_VIEW_FIELDS),
      ...view,
    })),
    transactionViews: (state.transactionViews ?? []).map((view) => ({
      ...defaultTableView(view.id, TRANSACTION_VIEW_FIELDS),
      ...view,
      filters: view.filters ?? [],
    })),
  };
}

interface ViewsState {
  activityViews: ActivityView[];
  movementViews: MovementView[];
  transactionViews: TableView[];
  getTransactionView: (viewId: string) => TableView;
  setTransactionView: (viewId: string, view: TableView) => void;

  getActivityView: (viewId: string) => ActivityView;
  deleteCategory: (categoryId: string) => void;
  deleteSubcategory: (subcategoryId: string) => void;
  setActivityView: (viewId: string, view: ActivityView) => void;

  getMovementView: (viewId: string) => MovementView;
  setMovementView: (viewId: string, view: MovementView) => void;
}

export const useViews = create<ViewsState>()(
  persist(
    (set, get) => ({
      activityViews: [],
      movementViews: [],
      transactionViews: [],

      getActivityView: (viewId: string): ActivityView => {
        const state = get();
        const existing = state.activityViews.find((view) => view.id === viewId);

        if (existing === undefined) {
          const view = defaultActivityView(viewId);
          set((state) => ({
            activityViews: [...state.activityViews, view],
          }));
          return view;
        }

        if (isLegacyView(existing)) {
          const view: ActivityView = {
            ...defaultActivityView(viewId),
            ...existing,
          };
          set((state) => ({
            activityViews: state.activityViews.map((v) =>
              v.id === viewId ? view : v,
            ),
          }));
          return view;
        }

        return existing;
      },
      setActivityView: (viewId: string, view: ActivityView) => {
        set((state) => {
          const existingIndex = state.activityViews.findIndex(
            (v) => v.id === viewId,
          );
          if (existingIndex !== -1) {
            const newActivityViews = [...state.activityViews];
            newActivityViews[existingIndex] = view;
            return { activityViews: newActivityViews };
          } else {
            return { activityViews: [...state.activityViews, view] };
          }
        });
      },

      deleteCategory: (categoryId: string) => {
        const state = get();
        state.activityViews.forEach((view) => {
          view.filters.forEach((filter) => {
            if (filter.field === "category" && filter.value !== undefined) {
              filter.value = filter.value.filter((v) => v !== categoryId);
            }
          });
        });
      },

      deleteSubcategory: (subcategoryId: string) => {
        const state = get();
        state.activityViews.forEach((view) => {
          view.filters.forEach((filter) => {
            if (filter.field === "subcategory" && filter.value !== undefined) {
              filter.value = filter.value.filter((v) => v !== subcategoryId);
            }
          });
        });
      },

      getMovementView: (viewId: string): MovementView => {
        const existing = get().movementViews.find((view) => view.id === viewId);
        if (existing && !isLegacyView(existing)) return existing;
        const view = {
          ...defaultTableView(viewId, MOVEMENT_VIEW_FIELDS),
          filters: [],
          ...existing,
        };
        get().setMovementView(viewId, view);
        return view;
      },
      setMovementView: (viewId: string, view: MovementView) => {
        set((state) => {
          const existingIndex = state.movementViews.findIndex(
            (v) => v.id === viewId,
          );
          if (existingIndex !== -1) {
            const newMovementViews = [...state.movementViews];
            newMovementViews[existingIndex] = view;
            return { movementViews: newMovementViews };
          } else {
            return { movementViews: [...state.movementViews, view] };
          }
        });
      },
      getTransactionView: (viewId) => {
        const existing = get().transactionViews.find(
          (view) => view.id === viewId,
        );
        if (existing) return existing;
        const view = defaultTableView(viewId, TRANSACTION_VIEW_FIELDS);
        get().setTransactionView(viewId, view);
        return view;
      },
      setTransactionView: (viewId, view) => {
        set((state) => ({
          transactionViews: state.transactionViews.some(
            (entry) => entry.id === viewId,
          )
            ? state.transactionViews.map((entry) =>
                entry.id === viewId ? view : entry,
              )
            : [...state.transactionViews, view],
        }));
      },
    }),
    {
      name: "views",
      version: 2,
      migrate: migrateViews,
      storage: storage,
    },
  ),
);
