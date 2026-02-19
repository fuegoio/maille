import type { ActivityFilter } from "@maille/core/activities";
import type { MovementFilter } from "@maille/core/movements";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "./storage";

type ActivityView = {
  id: string;
  showTransactions: boolean;
  filters: ActivityFilter[];
};

type MovementView = {
  id: string;
  filters: MovementFilter[];
};

interface ViewsState {
  activityViews: Record<string, ActivityView>;
  movementViews: Record<string, MovementView>;

  getActivityView: (viewId: string) => ActivityView;
  deleteCategory: (categoryId: string) => void;
  deleteSubcategory: (subcategoryId: string) => void;
  getMovementView: (viewId: string) => MovementView;
}

export const useViews = create<ViewsState>()(
  persist(
    (_set, get) => ({
      activityViews: {},
      movementViews: {},

      getActivityView: (viewId: string): ActivityView => {
        const state = get();
        if (!state.activityViews[viewId]) {
          state.activityViews[viewId] = {
            id: viewId,
            showTransactions: false,
            filters: [] as ActivityFilter[],
          };
        }

        return state.activityViews[viewId];
      },

      deleteCategory: (categoryId: string) => {
        const state = get();
        Object.values(state.activityViews).forEach((view) => {
          view.filters.forEach((filter) => {
            if (filter.field === "category" && filter.value !== undefined) {
              filter.value = filter.value.filter((v) => v !== categoryId);
            }
          });
        });
      },

      deleteSubcategory: (subcategoryId: string) => {
        const state = get();
        Object.values(state.activityViews).forEach((view) => {
          view.filters.forEach((filter) => {
            if (filter.field === "subcategory" && filter.value !== undefined) {
              filter.value = filter.value.filter((v) => v !== subcategoryId);
            }
          });
        });
      },

      getMovementView: (viewId: string): MovementView => {
        const state = get();
        if (!state.movementViews[viewId]) {
          state.movementViews[viewId] = {
            id: viewId,
            filters: [] as MovementFilter[],
          };
        }

        return state.movementViews[viewId];
      },
    }),
    {
      name: "views",
      storage: storage,
    },
  ),
);
