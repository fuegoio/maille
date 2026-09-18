import type { ActivityFilter } from "@maille/core/activities";
import type { MovementFilter } from "@maille/core/movements";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ViewConfig } from "@/types/views";

import { ACTIVITY_VIEW_FIELDS } from "@/components/activities/activity-view";

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

type MovementView = {
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
    grouping: "period",
  };
}

/**
 * Views persisted before the fields, ordering and grouping options
 * exist lack those keys; they are upgraded to the defaults on first read.
 */
function isLegacyActivityView(view: ActivityView): boolean {
  const persisted = view as Partial<ActivityView>;
  return (
    persisted.fields === undefined ||
    persisted.ordering === undefined ||
    persisted.grouping === undefined
  );
}

interface ViewsState {
  activityViews: ActivityView[];
  movementViews: MovementView[];

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

        if (isLegacyActivityView(existing)) {
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
        const state = get();
        let view = state.movementViews.find((view) => view.id === viewId);
        if (!view) {
          view = {
            id: viewId,
            filters: [] as MovementFilter[],
          };
          set((state) => ({
            movementViews: [...state.movementViews, view!],
          }));
        }

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
    }),
    {
      name: "views",
      storage: storage,
    },
  ),
);
