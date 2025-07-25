import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
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

export const useViewsStore = defineStore("views", () => {
  const activityViews = useStorage<Record<string, ActivityView>>(
    "activity_views",
    {},
  );
  const liabilityViews = useStorage<Record<string, LiabilityView>>(
    "liability_views",
    {},
  );
  const movementViews = useStorage<Record<string, MovementView>>(
    "movement_views",
    {},
  );

  const getActivityView = (viewId: string) => {
    if (!activityViews.value[viewId]) {
      activityViews.value[viewId] = {
        id: viewId,
        showTransactions: false,
        filters: [] as ActivityFilter[],
      };
    }

    return activityViews.value[viewId];
  };

  const deleteCategory = (categoryId: UUID) => {
    Object.values(activityViews.value).forEach((view) => {
      view.filters.forEach((filter) => {
        if (filter.field === "category" && filter.value !== undefined) {
          filter.value = filter.value.filter((v) => v !== categoryId);
        }
      });
    });
  };

  const deleteSubcategory = (subcategoryId: UUID) => {
    Object.values(activityViews.value).forEach((view) => {
      view.filters.forEach((filter) => {
        if (filter.field === "subcategory" && filter.value !== undefined) {
          filter.value = filter.value.filter((v) => v !== subcategoryId);
        }
      });
    });
  };

  const getLiabilityView = (viewId: string) => {
    if (!liabilityViews.value[viewId]) {
      liabilityViews.value[viewId] = {
        id: viewId,
        filters: [] as LiabilityFilter[],
      };
    }

    return liabilityViews.value[viewId];
  };

  const getMovementView = (viewId: string) => {
    if (!movementViews.value[viewId]) {
      movementViews.value[viewId] = {
        id: viewId,
        filters: [] as MovementFilter[],
      };
    }

    return movementViews.value[viewId];
  };

  return {
    getActivityView,
    getLiabilityView,
    getMovementView,

    deleteCategory,
    deleteSubcategory,
  };
});
