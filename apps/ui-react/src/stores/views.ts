import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { UUID } from "crypto";

import type { ActivityFilter } from "@maille/core/activities";
import type { LiabilityFilter } from "@maille/core/liabilities";
import type { MovementFilter } from "@maille/core/movements";

type ActivityView = {
  id: string;
  showTransactions: boolean;
  filters: ActivityFilter[];
};

type LiabilityView = {
  id: string;
  filters: LiabilityFilter[];
};

type MovementView = {
  id: string;
  filters: MovementFilter[];
};

interface ViewsState {
  activityViews: Record<string, ActivityView>;
  liabilityViews: Record<string, LiabilityView>;
  movementViews: Record<string, MovementView>;

  getActivityView: (viewId: string) => ActivityView;
  deleteCategory: (categoryId: UUID) => void;
  deleteSubcategory: (subcategoryId: UUID) => void;
  getLiabilityView: (viewId: string) => LiabilityView;
  getMovementView: (viewId: string) => MovementView;
}

export const viewsStore = createStore<ViewsState>()(
  persist(
    (_set, get) => ({
      activityViews: {},
      liabilityViews: {},
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

      deleteCategory: (categoryId: UUID) => {
        const state = get();
        Object.values(state.activityViews).forEach((view) => {
          view.filters.forEach((filter) => {
            if (filter.field === "category" && filter.value !== undefined) {
              filter.value = filter.value.filter((v) => v !== categoryId);
            }
          });
        });
      },

      deleteSubcategory: (subcategoryId: UUID) => {
        const state = get();
        Object.values(state.activityViews).forEach((view) => {
          view.filters.forEach((filter) => {
            if (filter.field === "subcategory" && filter.value !== undefined) {
              filter.value = filter.value.filter((v) => v !== subcategoryId);
            }
          });
        });
      },

      getLiabilityView: (viewId: string): LiabilityView => {
        const state = get();
        if (!state.liabilityViews[viewId]) {
          state.liabilityViews[viewId] = {
            id: viewId,
            filters: [] as LiabilityFilter[],
          };
        }

        return state.liabilityViews[viewId];
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
    },
  ),
);

