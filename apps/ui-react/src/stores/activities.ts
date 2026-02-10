import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import {
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type Activity,
  type ActivityCategory,
  type ActivitySubCategory,
  type ActivityType,
  type Transaction,
} from "@maille/core/activities";
import type { UUID } from "crypto";
import type { SyncEvent } from "@maille/core/sync";
import { accountsStore } from "./accounts";
import { movementsStore } from "./movements";
import type { Mutation } from "@/mutations";
import { storage } from "./storage";

interface ActivitiesState {
  activities: Activity[];
  activityCategories: ActivityCategory[];
  activitySubcategories: ActivitySubCategory[];
  focusedActivity: UUID | null;
  showTransactions: boolean;

  getActivityById: (activityId: UUID) => Activity | undefined;
  getActivityCategoryById: (categoryId: UUID) => ActivityCategory | undefined;
  getActivitySubcategoryById: (subcategoryId: UUID) => ActivitySubCategory | undefined;

  setFocusedActivity: (activityId: UUID | null) => void;
  setShowTransactions: (show: boolean) => void;
  addNewTransaction: (
    activityId: UUID,
    amount: number,
    fromAccount: UUID,
    toAccount: UUID,
  ) => Transaction;
  updateTransaction: (activityId: UUID, transactionId: UUID, update: Partial<Transaction>) => void;
  deleteTransaction: (activityId: UUID, transactionId: UUID) => void;

  addActivity: (params: {
    id?: UUID;
    user: string;
    number: number;
    name: string;
    description: string | null;
    date: Date;
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
      date?: Date;
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
      focusedActivity: null,
      showTransactions: false,

      getActivityById: (activityId: UUID): Activity | undefined => {
        return get().activities.find((a) => a.id === activityId);
      },

      setFocusedActivity: (activityId: UUID | null) => {
        set({ focusedActivity: activityId });
      },

      setShowTransactions: (show: boolean) => {
        set({ showTransactions: show });
      },

      addNewTransaction: (activityId: UUID, amount: number, fromAccount: UUID, toAccount: UUID) => {
        const newTransaction: Transaction = {
          id: crypto.randomUUID(),
          amount,
          fromAccount,
          fromUser: null,
          toAccount,
          toUser: null,
        };

        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                transactions: [...activity.transactions, newTransaction],
              };
            }
            return activity;
          }),
        }));

        return newTransaction;
      },

      updateTransaction: (activityId: UUID, transactionId: UUID, update: Partial<Transaction>) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                transactions: activity.transactions.map((t) =>
                  t.id === transactionId ? { ...t, ...update } : t,
                ),
              };
            }
            return activity;
          }),
        }));
      },

      deleteTransaction: (activityId: UUID, transactionId: UUID) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                transactions: activity.transactions.filter((t) => t.id !== transactionId),
              };
            }
            return activity;
          }),
        }));
      },

      getActivityCategoryById: (categoryId: UUID): ActivityCategory | undefined => {
        return get().activityCategories.find((c) => c.id === categoryId);
      },

      getActivitySubcategoryById: (subcategoryId: UUID): ActivitySubCategory | undefined => {
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
      }) => {
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
          amount: getActivityTransactionsReconciliationSum(type, transactions, accounts),
          status: getActivityStatus(date, transactions, movements, accounts, getMovementById),
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
          date?: Date;
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
                  update.description !== undefined ? update.description : activity.description,
                date: update.date !== undefined ? update.date : activity.date,
                type: update.type !== undefined ? update.type : activity.type,
                category: update.category !== undefined ? update.category : activity.category,
                subcategory:
                  update.subcategory !== undefined ? update.subcategory : activity.subcategory,
                project: update.project !== undefined ? update.project : activity.project,
                transactions:
                  update.transactions !== undefined ? update.transactions : activity.transactions,
                movements: update.movements !== undefined ? update.movements : activity.movements,

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
          activities: state.activities.filter((activity) => activity.id !== activityId),
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

      addActivitySubcategory: ({ id, name, category }): ActivitySubCategory => {
        const newSubcategory = {
          id: id ?? crypto.randomUUID(),
          name,
          category,
          workspace: null,
        };

        set((state) => ({
          activitySubcategories: [...state.activitySubcategories, newSubcategory],
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
          activitySubcategories: state.activitySubcategories.map((subcategory) => {
            if (subcategory.id === subcategoryId) {
              return {
                ...subcategory,
                name: update.name !== undefined ? update.name : subcategory.name,
                category: update.category !== undefined ? update.category : subcategory.category,
              };
            }
            return subcategory;
          }),
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
          activitySubcategories: [...state.activitySubcategories, payload.subcategory],
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
            date: new Date(event.payload.date),
            movements: event.payload.movement ? [event.payload.movement] : [],
          });
        } else if (event.type === "updateActivity") {
          get().updateActivity(event.payload.id, {
            ...event.payload,
            date: event.payload.date ? new Date(event.payload.date) : undefined,
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

      handleMutationSuccess: (mutation: Mutation) => {
        if (!mutation.result) return;
        if (mutation.name === "createActivity") {
          set((state) => ({
            activities: state.activities.map((activity) => {
              if (activity.id === mutation.variables.id) {
                return {
                  ...activity,
                  id: mutation.result.createActivity.id,
                  number: mutation.result.createActivity.number,
                };
              }
              return activity;
            }),
          }));
        }
      },

      handleMutationError: (mutation: Mutation) => {
        if (mutation.name === "createActivity") {
          get().deleteActivity(mutation.variables.id);
        } else if (mutation.name === "updateActivity") {
          get().updateActivity(mutation.variables.id, {
            ...mutation.rollbackData,
            date: new Date(mutation.rollbackData.date),
            type: mutation.rollbackData.type as ActivityType,
          });
        } else if (mutation.name === "deleteActivity") {
          get().restoreActivity(mutation.rollbackData);
        } else if (mutation.name === "createActivityCategory") {
          get().deleteActivityCategory(mutation.variables.id);
        } else if (mutation.name === "updateActivityCategory") {
          get().updateActivityCategory(mutation.variables.id, {
            ...mutation.rollbackData,
          });
        } else if (mutation.name === "deleteActivityCategory") {
          get().restoreActivityCategory(mutation.rollbackData);
        } else if (mutation.name === "createActivitySubCategory") {
          get().deleteActivitySubcategory(mutation.variables.id);
        } else if (mutation.name === "updateActivitySubCategory") {
          get().updateActivitySubcategory(mutation.variables.id, {
            ...mutation.rollbackData,
          });
        } else if (mutation.name === "deleteActivitySubCategory") {
          get().restoreActivitySubcategory(mutation.rollbackData);
        }
      },
    }),
    {
      name: "activities",
      storage: storage,
    },
  ),
);

// Custom hook to use the activities store
export function useActivitiesStore() {
  const state = activitiesStore.getState();
  return {
    activities: state.activities,
    categories: state.activityCategories,
    subcategories: state.activitySubcategories,
    showTransactions: state.showTransactions,
    focusedActivity: state.focusedActivity,
  };
}
