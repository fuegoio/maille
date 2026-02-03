import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import {
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type Activity,
  type ActivityCategory,
  type ActivitySubCategory,
  type ActivityType,
} from "@maille/core/activities";
import type { UUID } from "crypto";
import type { SyncEvent } from "@maille/core/sync";
import dayjs from "dayjs";
import { accountsStore } from "./accounts";
import { movementsStore } from "./movements";
import type { Mutation } from "@/mutations";

interface ActivitiesState {
  activities: Activity[];
  activityCategories: ActivityCategory[];
  activitySubcategories: ActivitySubCategory[];

  getActivityById: (activityId: UUID) => Activity | undefined;
  getActivityCategoryById: (categoryId: UUID) => ActivityCategory | undefined;
  getActivitySubcategoryById: (
    subcategoryId: UUID,
  ) => ActivitySubCategory | undefined;

  addActivity: (params: {
    id?: UUID;
    user: string;
    number: number;
    name: string;
    description: string | null;
    date: dayjs.Dayjs;
    type: ActivityType;
    category: UUID | null;
    subcategory: UUID | null;
    project: UUID | null;
    transactions: any[];
    movements: any[];
  }) => Activity;

  updateActivity: (
    activityId: UUID,
    update: {
      name?: string;
      description?: string | null;
      date?: dayjs.Dayjs;
      type?: ActivityType;
      category?: UUID | null;
      subcategory?: UUID | null;
      project?: UUID | null;
      transactions?: any[];
      movements?: any[];
    },
  ) => void;

  deleteActivity: (activityId: UUID) => void;
  restoreActivity: (activity: Activity) => void;

  addActivityCategory: (params: {
    id?: UUID;
    name: string;
    type: ActivityType;
  }) => ActivityCategory;

  updateActivityCategory: (
    categoryId: UUID,
    update: {
      name?: string;
      type?: ActivityType;
    },
  ) => void;

  deleteActivityCategory: (categoryId: UUID) => void;
  restoreActivityCategory: (payload: {
    category: ActivityCategory;
    activities: UUID[];
    activitiesSubcategories: Record<UUID, UUID>;
  }) => void;

  addActivitySubcategory: (params: {
    id?: UUID;
    name: string;
    category: UUID;
  }) => ActivitySubCategory;

  updateActivitySubcategory: (
    subcategoryId: UUID,
    update: {
      name?: string;
      category?: UUID;
    },
  ) => void;

  deleteActivitySubcategory: (subcategoryId: UUID) => void;
  restoreActivitySubcategory: (payload: {
    subcategory: ActivitySubCategory;
    activities: UUID[];
  }) => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

export const activitiesStore = createStore<ActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],
      activityCategories: [],
      activitySubcategories: [],

      getActivityById: (activityId: UUID): Activity | undefined => {
        return get().activities.find((a) => a.id === activityId);
      },

      getActivityCategoryById: (
        categoryId: UUID,
      ): ActivityCategory | undefined => {
        return get().activityCategories.find((c) => c.id === categoryId);
      },

      getActivitySubcategoryById: (
        subcategoryId: UUID,
      ): ActivitySubCategory | undefined => {
        return get().activitySubcategories.find((s) => s.id === subcategoryId);
      },

      addActivity: ({
        id,
        user,
        number,
        name,
        description,
        date,
        type,
        category,
        subcategory,
        project,
        transactions,
        movements,
      }: {
        id?: UUID;
        user: string;
        number: number;
        name: string;
        description: string | null;
        date: dayjs.Dayjs;
        type: ActivityType;
        category: UUID | null;
        subcategory: UUID | null;
        project: UUID | null;
        transactions: any[];
        movements: any[];
      }): Activity => {
        const accounts = accountsStore.getState().accounts;
        const getMovementById = movementsStore.getState().getMovementById;

        const newActivity: Activity = {
          id: id ?? crypto.randomUUID(),
          user,
          number,
          name,
          description,
          date,
          type,
          category,
          subcategory,
          project,
          transactions,
          movements,
          amount: getActivityTransactionsReconciliationSum(
            type,
            transactions,
            accounts,
          ),
          status: getActivityStatus(
            date,
            transactions,
            movements,
            accounts,
            getMovementById,
          ),
        };

        set((state) => ({
          activities: [...state.activities, newActivity],
        }));

        return newActivity;
      },

      updateActivity: (
        activityId: UUID,
        update: {
          name?: string;
          description?: string | null;
          date?: dayjs.Dayjs;
          type?: ActivityType;
          category?: UUID | null;
          subcategory?: UUID | null;
          project?: UUID | null;
          transactions?: any[];
          movements?: any[];
        },
      ) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                name: update.name !== undefined ? update.name : activity.name,
                description:
                  update.description !== undefined
                    ? update.description
                    : activity.description,
                date: update.date !== undefined ? update.date : activity.date,
                type: update.type !== undefined ? update.type : activity.type,
                category:
                  update.category !== undefined
                    ? update.category
                    : activity.category,
                subcategory:
                  update.subcategory !== undefined
                    ? update.subcategory
                    : activity.subcategory,
                project:
                  update.project !== undefined
                    ? update.project
                    : activity.project,
                transactions:
                  update.transactions !== undefined
                    ? update.transactions
                    : activity.transactions,
                movements:
                  update.movements !== undefined
                    ? update.movements
                    : activity.movements,

                amount: getActivityTransactionsReconciliationSum(
                  update.type ?? activity.type,
                  update.transactions ?? activity.transactions,
                  accountsStore.getState().accounts,
                ),
                status: getActivityStatus(
                  update.date ?? activity.date,
                  update.transactions ?? activity.transactions,
                  update.movements ?? activity.movements,
                  accountsStore.getState().accounts,
                  movementsStore.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));
      },

      deleteActivity: (activityId: UUID) => {
        set((state) => ({
          activities: state.activities.filter(
            (activity) => activity.id !== activityId,
          ),
        }));
      },

      restoreActivity: (activity: Activity) => {
        set((state) => ({
          activities: [...state.activities, activity],
        }));
      },

      addActivityCategory: ({
        id,
        name,
        type,
      }: {
        id?: UUID;
        name: string;
        type: ActivityType;
      }): ActivityCategory => {
        const newCategory = {
          id: id ?? crypto.randomUUID(),
          name,
          type,
          workspace: null,
        };

        set((state) => ({
          activityCategories: [...state.activityCategories, newCategory],
        }));

        return newCategory;
      },

      updateActivityCategory: (
        categoryId: UUID,
        update: {
          name?: string;
          type?: ActivityType;
        },
      ) => {
        set((state) => ({
          activityCategories: state.activityCategories.map((category) => {
            if (category.id === categoryId) {
              return {
                ...category,
                name: update.name !== undefined ? update.name : category.name,
                type: update.type !== undefined ? update.type : category.type,
              };
            }
            return category;
          }),
        }));
      },

      deleteActivityCategory: (categoryId: UUID) => {
        set((state) => ({
          activityCategories: state.activityCategories.filter(
            (category) => category.id !== categoryId,
          ),
        }));
      },

      restoreActivityCategory: (payload) => {
        set((state) => ({
          activityCategories: [...state.activityCategories, payload.category],
          activities: state.activities.map((activity) => {
            if (payload.activities.includes(activity.id)) {
              return {
                ...activity,
                category: payload.category.id,
                subcategory: payload.activitiesSubcategories[activity.id],
              };
            }
            return activity;
          }),
        }));
      },

      addActivitySubcategory: ({
        id,
        name,
        category,
      }: {
        id?: UUID;
        name: string;
        category: UUID;
      }): ActivitySubCategory => {
        const newSubcategory = {
          id: id ?? crypto.randomUUID(),
          name,
          category,
          workspace: null,
        };

        set((state) => ({
          activitySubcategories: [
            ...state.activitySubcategories,
            newSubcategory,
          ],
        }));

        return newSubcategory;
      },

      updateActivitySubcategory: (
        subcategoryId: UUID,
        update: {
          name?: string;
          category?: UUID;
        },
      ) => {
        set((state) => ({
          activitySubcategories: state.activitySubcategories.map(
            (subcategory) => {
              if (subcategory.id === subcategoryId) {
                return {
                  ...subcategory,
                  name:
                    update.name !== undefined ? update.name : subcategory.name,
                  category:
                    update.category !== undefined
                      ? update.category
                      : subcategory.category,
                };
              }
              return subcategory;
            },
          ),
        }));
      },

      deleteActivitySubcategory: (subcategoryId: UUID) => {
        set((state) => ({
          activitySubcategories: state.activitySubcategories.filter(
            (subcategory) => subcategory.id !== subcategoryId,
          ),
        }));
      },

      restoreActivitySubcategory: (payload) => {
        set((state) => ({
          activitySubcategories: [
            ...state.activitySubcategories,
            payload.subcategory,
          ],
          activities: state.activities.map((activity) => {
            if (payload.activities.includes(activity.id)) {
              return {
                ...activity,
                subcategory: payload.subcategory.id,
              };
            }
            return activity;
          }),
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createActivity") {
          get().addActivity({
            ...event.payload,
            date: dayjs(event.payload.date),
            movements: event.payload.movement ? [event.payload.movement] : [],
          });
        } else if (event.type === "updateActivity") {
          get().updateActivity(event.payload.id, {
            ...event.payload,
            date: event.payload.date ? dayjs(event.payload.date) : undefined,
          });
        } else if (event.type === "deleteActivity") {
          get().deleteActivity(event.payload.id);
        } else if (event.type === "createActivityCategory") {
          get().addActivityCategory(event.payload);
        } else if (event.type === "updateActivityCategory") {
          get().updateActivityCategory(event.payload.id, {
            ...event.payload,
          });
        } else if (event.type === "deleteActivityCategory") {
          get().deleteActivityCategory(event.payload.id);
        } else if (event.type === "createActivitySubCategory") {
          get().addActivitySubcategory(event.payload);
        } else if (event.type === "updateActivitySubCategory") {
          get().updateActivitySubcategory(event.payload.id, {
            ...event.payload,
          });
        } else if (event.type === "deleteActivitySubCategory") {
          get().deleteActivitySubcategory(event.payload.id);
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createActivity") {
          get().deleteActivity(event.variables.id);
        } else if (event.name === "updateActivity") {
          get().updateActivity(event.variables.id, {
            ...event.rollbackData,
            date: dayjs(event.rollbackData.date),
            type: event.rollbackData.type as ActivityType,
          });
        } else if (event.name === "deleteActivity") {
          get().restoreActivity(event.rollbackData);
        } else if (event.name === "createActivityCategory") {
          get().deleteActivityCategory(event.variables.id);
        } else if (event.name === "updateActivityCategory") {
          get().updateActivityCategory(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteActivityCategory") {
          get().restoreActivityCategory(event.rollbackData);
        } else if (event.name === "createActivitySubCategory") {
          get().deleteActivitySubcategory(event.variables.id);
        } else if (event.name === "updateActivitySubCategory") {
          get().updateActivitySubcategory(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteActivitySubCategory") {
          get().restoreActivitySubcategory(event.rollbackData);
        }
      },
    }),
    {
      name: "activities",
    },
  ),
);
