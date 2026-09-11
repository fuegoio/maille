import type { SerializedHistoryEntry } from "@maille/core/history";
import type { SyncEvent } from "@maille/core/sync";

import {
  ActivityType,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type Activity,
  type ActivityCategory,
  type ActivityMovement,
  type ActivitySharing,
  type ActivitySubCategory,
  type Transaction,
} from "@maille/core/activities";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { useAccounts } from "./accounts";
import { useMovements } from "./movements";
import { migrationFlags, storage } from "./storage";

export const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "bg-red-400",
  [ActivityType.REVENUE]: "bg-green-400",
  [ActivityType.INVESTMENT]: "bg-orange-400",
  [ActivityType.NEUTRAL]: "bg-slate-400",
};

export const ACTIVITY_TYPES_CHART_COLOR = {
  [ActivityType.EXPENSE]: "var(--color-red-400)",
  [ActivityType.REVENUE]: "var(--color-green-400)",
  [ActivityType.INVESTMENT]: "var(--color-orange-400)",
  [ActivityType.NEUTRAL]: "var(--color-slate-400)",
};

// Activity type names mapping
export const ACTIVITY_TYPES_NAME = {
  [ActivityType.EXPENSE]: "Expense",
  [ActivityType.REVENUE]: "Revenue",
  [ActivityType.INVESTMENT]: "Investment",
  [ActivityType.NEUTRAL]: "Neutral",
};

interface ActivitiesState {
  activities: Activity[];
  activityCategories: ActivityCategory[];
  activitySubcategories: ActivitySubCategory[];
  showTransactions: boolean;

  getActivityById: (activityId: string) => Activity | undefined;
  getActivityCategoryById: (categoryId: string) => ActivityCategory | undefined;
  getActivitySubcategoryById: (
    subcategoryId: string,
  ) => ActivitySubCategory | undefined;

  setShowTransactions: (show: boolean) => void;
  addTransaction: (activityId: string, transaction: Transaction) => Transaction;
  updateTransaction: (
    activityId: string,
    transactionId: string,
    update: Omit<Partial<Transaction>, "id">,
  ) => void;
  deleteTransaction: (activityId: string, transactionId: string) => void;

  addActivityMovement: (activityId: string, movement: ActivityMovement) => void;
  updateActivityMovement: (
    activityId: string,
    movementId: string,
    update: Omit<Partial<ActivityMovement>, "id">,
  ) => void;
  deleteActivityMovement: (
    activityId: string,
    activityMovementId: string,
  ) => void;

  addActivity: (
    activity: Omit<Activity, "amount" | "status" | "history"> & {
      history?: SerializedHistoryEntry[];
    },
  ) => Activity;
  updateActivity: (
    activityId: string,
    update: {
      name?: string;
      description?: string | null;
      date?: Date;
      type?: ActivityType;
      category?: string | null;
      subcategory?: string | null;
      project?: string | null;
      sharing?: ActivitySharing[];
      history?: SerializedHistoryEntry[];
    },
  ) => void;
  deleteActivity: (activityId: string) => void;
  restoreActivity: (activity: Activity) => void;
  upsertHistoryEntry: (
    activityId: string,
    entry: SerializedHistoryEntry,
  ) => void;

  addActivityCategory: (activityCategory: ActivityCategory) => ActivityCategory;
  updateActivityCategory: (
    categoryId: string,
    update: {
      name?: string;
      type?: ActivityType;
      emoji?: string | null;
    },
  ) => void;
  deleteActivityCategory: (categoryId: string) => void;
  restoreActivityCategory: (payload: {
    category: ActivityCategory;
    activities: string[];
    activitiesSubcategories: Record<string, string>;
  }) => void;

  addActivitySubcategory: (
    activitySubcategory: ActivitySubCategory,
  ) => ActivitySubCategory;
  updateActivitySubcategory: (
    subcategoryId: string,
    update: {
      name?: string;
      category?: string;
      emoji?: string | null;
    },
  ) => void;
  deleteActivitySubcategory: (subcategoryId: string) => void;
  restoreActivitySubcategory: (payload: {
    subcategory: ActivitySubCategory;
    activities: string[];
  }) => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

/**
 * Recompute the reconciliation status of every activity with a transaction or
 * linked movement on an account whose `movements` flag just changed: enabling
 * or disabling movements changes whether those transactions require linked
 * movements to be reconciled, so cached statuses become stale.
 *
 * The account snapshot is overridden locally because the accounts store
 * applies updateAccount events after this store (see useSync's event
 * fan-out).
 */
function recomputeActivityStatusesForAccount(
  accountId: string,
  movements: boolean,
) {
  const accounts = useAccounts
    .getState()
    .accounts.map((account) =>
      account.id === accountId ? { ...account, movements } : account,
    );
  const getMovementById = useMovements.getState().getMovementById;

  useActivities.setState((state) => ({
    activities: state.activities.map((activity) => {
      const hasTransactionOnAccount = activity.transactions.some(
        (transaction) =>
          transaction.fromAccount === accountId ||
          transaction.toAccount === accountId,
      );
      const hasMovementOnAccount = activity.movements.some(
        (activityMovement) =>
          getMovementById(activityMovement.movement)?.account === accountId,
      );
      if (!hasTransactionOnAccount && !hasMovementOnAccount) {
        return activity;
      }

      return {
        ...activity,
        status: getActivityStatus(
          activity.date,
          activity.transactions,
          activity.movements,
          accounts,
          getMovementById,
        ),
      };
    }),
  }));
}

export const useActivities = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],
      activityCategories: [],
      activitySubcategories: [],
      showTransactions: false,

      getActivityById: (activityId: string): Activity | undefined => {
        return get().activities.find((a) => a.id === activityId);
      },

      setShowTransactions: (show: boolean) => {
        set({ showTransactions: show });
      },

      addTransaction: (activityId, transaction) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              const newTransactions = [...activity.transactions, transaction];
              return {
                ...activity,
                transactions: newTransactions,
                amount: getActivityTransactionsReconciliationSum(
                  activity.type,
                  newTransactions,
                  useAccounts.getState().accounts,
                ),
                status: getActivityStatus(
                  activity.date,
                  newTransactions,
                  activity.movements,
                  useAccounts.getState().accounts,
                  useMovements.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));

        return transaction;
      },

      updateTransaction: (activityId, transactionId, update) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              const newTransactions = activity.transactions.map((t) =>
                t.id === transactionId ? { ...t, ...filteredUpdate } : t,
              );
              return {
                ...activity,
                transactions: newTransactions,
                amount: getActivityTransactionsReconciliationSum(
                  activity.type,
                  newTransactions,
                  useAccounts.getState().accounts,
                ),
                status: getActivityStatus(
                  activity.date,
                  newTransactions,
                  activity.movements,
                  useAccounts.getState().accounts,
                  useMovements.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));
      },

      deleteTransaction: (activityId, transactionId) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              const newTransactions = activity.transactions.filter(
                (t) => t.id !== transactionId,
              );
              return {
                ...activity,
                transactions: newTransactions,
                amount: getActivityTransactionsReconciliationSum(
                  activity.type,
                  newTransactions,
                  useAccounts.getState().accounts,
                ),
                status: getActivityStatus(
                  activity.date,
                  newTransactions,
                  activity.movements,
                  useAccounts.getState().accounts,
                  useMovements.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));
      },

      addActivityMovement: (activityId, movement) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              const newMovements = [...activity.movements, movement];
              return {
                ...activity,
                movements: newMovements,
                status: getActivityStatus(
                  activity.date,
                  activity.transactions,
                  newMovements,
                  useAccounts.getState().accounts,
                  useMovements.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));
      },
      updateActivityMovement: (activityId, movementId, update) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              const newMovements = activity.movements.map((m) =>
                m.id === movementId ? { ...m, ...filteredUpdate } : m,
              );
              return {
                ...activity,
                movements: newMovements,
                status: getActivityStatus(
                  activity.date,
                  activity.transactions,
                  newMovements,
                  useAccounts.getState().accounts,
                  useMovements.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));
      },
      deleteActivityMovement: (activityId, activityMovementId) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              const newMovements = activity.movements.filter(
                (m) => m.id !== activityMovementId,
              );
              return {
                ...activity,
                movements: newMovements,
                status: getActivityStatus(
                  activity.date,
                  activity.transactions,
                  newMovements,
                  useAccounts.getState().accounts,
                  useMovements.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));
      },

      getActivityCategoryById: (
        categoryId: string,
      ): ActivityCategory | undefined => {
        return get().activityCategories.find((c) => c.id === categoryId);
      },

      getActivitySubcategoryById: (
        subcategoryId: string,
      ): ActivitySubCategory | undefined => {
        return get().activitySubcategories.find((s) => s.id === subcategoryId);
      },

      addActivity: (activity) => {
        const accounts = useAccounts.getState().accounts;
        const getMovementById = useMovements.getState().getMovementById;

        const newActivity: Activity = {
          ...activity,
          history: activity.history ?? [],
          amount: getActivityTransactionsReconciliationSum(
            activity.type,
            activity.transactions,
            accounts,
          ),
          status: getActivityStatus(
            activity.date,
            activity.transactions,
            activity.movements,
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
        activityId: string,
        update: {
          name?: string;
          description?: string | null;
          date?: Date;
          type?: ActivityType;
          category?: string | null;
          subcategory?: string | null;
          project?: string | null;
          history?: SerializedHistoryEntry[];
        },
      ) => {
        const filteredUpdate = Object.fromEntries(
          Object.entries(update).filter(([_, value]) => value !== undefined),
        );

        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              return {
                ...activity,
                ...filteredUpdate,
                // Fund moves date with their activity: a new date re-dates
                // the legs of every transaction under it.
                ...(update.date !== undefined
                  ? {
                      transactions: activity.transactions.map(
                        (transaction) => ({
                          ...transaction,
                          fundMoves: (transaction.fundMoves ?? []).map(
                            (leg) => ({ ...leg, date: update.date! }),
                          ),
                        }),
                      ),
                    }
                  : {}),
                amount: getActivityTransactionsReconciliationSum(
                  update.type ?? activity.type,
                  activity.transactions,
                  useAccounts.getState().accounts,
                ),
                status: getActivityStatus(
                  update.date ?? activity.date,
                  activity.transactions,
                  activity.movements,
                  useAccounts.getState().accounts,
                  useMovements.getState().getMovementById,
                ),
              };
            }
            return activity;
          }),
        }));
      },

      deleteActivity: (activityId: string) => {
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

      upsertHistoryEntry: (activityId, entry) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id !== activityId) return activity;
            const exists = activity.history.some((e) => e.id === entry.id);
            return {
              ...activity,
              history: exists
                ? activity.history.map((e) => (e.id === entry.id ? entry : e))
                : [...activity.history, entry],
            };
          }),
        }));
      },

      addActivityCategory: (activityCategory): ActivityCategory => {
        set((state) => ({
          activityCategories: [...state.activityCategories, activityCategory],
        }));

        return activityCategory;
      },

      updateActivityCategory: (
        categoryId: string,
        update: {
          name?: string;
          type?: ActivityType;
          emoji?: string | null;
        },
      ) => {
        set((state) => ({
          activityCategories: state.activityCategories.map((category) => {
            if (category.id === categoryId) {
              return {
                ...category,
                name: update.name !== undefined ? update.name : category.name,
                type: update.type !== undefined ? update.type : category.type,
                emoji:
                  update.emoji !== undefined ? update.emoji : category.emoji,
              };
            }
            return category;
          }),
        }));
      },

      deleteActivityCategory: (categoryId: string) => {
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

      addActivitySubcategory: (activitySubcategory): ActivitySubCategory => {
        set((state) => ({
          activitySubcategories: [
            ...state.activitySubcategories,
            activitySubcategory,
          ],
        }));

        return activitySubcategory;
      },

      updateActivitySubcategory: (
        subcategoryId: string,
        update: {
          name?: string;
          category?: string;
          emoji?: string | null;
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
                  emoji:
                    update.emoji !== undefined
                      ? update.emoji
                      : subcategory.emoji,
                };
              }
              return subcategory;
            },
          ),
        }));
      },

      deleteActivitySubcategory: (subcategoryId: string) => {
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
        if (event.type === "createHistory") {
          if (event.payload.entityType === "activity") {
            get().upsertHistoryEntry(event.payload.entityId, event.payload);
          }
        } else if (event.type === "createActivity") {
          get().addActivity({
            ...event.payload,
            date: new Date(event.payload.date),
            sharing: event.payload.sharing ?? [],
            movements: event.payload.movement ? [event.payload.movement] : [],
            transactions: event.payload.transactions.map<Transaction>(
              (transaction) => ({
                ...transaction,
                fundMoves: transaction.fundMoves?.map((move) => ({
                  ...move,
                  date: new Date(move.date),
                })),
              }),
            ),
          });
        } else if (event.type === "updateActivity") {
          get().updateActivity(event.payload.id, {
            ...event.payload,
            date: event.payload.date ? new Date(event.payload.date) : undefined,
          });
        } else if (event.type === "deleteActivity") {
          get().deleteActivity(event.payload.id);
        } else if (event.type === "deleteFund") {
          // The deleted fund's legs go back to Untracked (a null side); a
          // leg left untracked on both sides carries no information and
          // goes. Legs live on their transactions.
          set((state) => ({
            activities: state.activities.map((activity) => ({
              ...activity,
              transactions: activity.transactions.map((transaction) => {
                const legs = transaction.fundMoves;
                if (
                  !legs?.some(
                    (leg) =>
                      leg.fromFund === event.payload.id ||
                      leg.toFund === event.payload.id,
                  )
                ) {
                  return transaction;
                }
                return {
                  ...transaction,
                  fundMoves: legs!
                    .map((leg) => ({
                      ...leg,
                      fromFund:
                        leg.fromFund === event.payload.id ? null : leg.fromFund,
                      toFund:
                        leg.toFund === event.payload.id ? null : leg.toFund,
                    }))
                    .filter(
                      (leg) => leg.fromFund !== null || leg.toFund !== null,
                    ),
                };
              }),
            })),
          }));
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
        } else if (event.type === "addTransaction") {
          const { activityId, fundMoves, ...transaction } = event.payload;
          get().addTransaction(activityId, {
            ...transaction,
            ...(fundMoves !== undefined
              ? {
                  fundMoves: fundMoves.map((move) => ({
                    ...move,
                    date: new Date(move.date),
                  })),
                }
              : {}),
          } as Transaction);
        } else if (event.type === "updateTransaction") {
          const { activityId, id, fundMoves, ...update } = event.payload;
          get().updateTransaction(activityId, id, {
            ...update,
            ...(fundMoves !== undefined
              ? {
                  fundMoves: fundMoves.map((move) => ({
                    ...move,
                    date: new Date(move.date),
                  })),
                }
              : {}),
          });
        } else if (event.type === "deleteTransaction") {
          get().deleteTransaction(event.payload.activityId, event.payload.id);
        } else if (event.type === "createMovementActivity") {
          get().addActivityMovement(event.payload.activity, event.payload);
        } else if (event.type === "updateMovementActivity") {
          get().updateActivityMovement(
            event.payload.activity,
            event.payload.id,
            event.payload,
          );
        } else if (event.type === "deleteMovementActivity") {
          get().deleteActivityMovement(
            event.payload.activity,
            event.payload.id,
          );
        } else if (event.type === "updateActivitySharing") {
          get().updateActivity(event.payload.activityId, {
            sharing: event.payload.sharing,
          });
        } else if (event.type === "deleteMovement") {
          get().activities.forEach((activity) => {
            activity.movements.forEach((am) => {
              if (am.movement === event.payload.id) {
                get().deleteActivityMovement(activity.id, am.id);
              }
            });
          });
        } else if (event.type === "updateAccount") {
          if (event.payload.movements !== undefined) {
            recomputeActivityStatusesForAccount(
              event.payload.id,
              event.payload.movements,
            );
          }
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
                  id: mutation.result!.createActivity.id,
                };
              }
              return activity;
            }),
          }));
        } else if (mutation.name === "shareActivity") {
          get().updateActivity(mutation.variables.id, {
            sharing: mutation.result.shareActivity,
          });
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
        } else if (mutation.name === "shareActivity") {
          const activitySharing = get().getActivityById(
            mutation.variables.id,
          )?.sharing;
          if (!activitySharing) return;
          get().updateActivity(mutation.variables.id, {
            sharing: activitySharing.filter(
              (s) => s.user !== mutation.variables.userId,
            ),
          });
        } else if (mutation.name === "updateAccount") {
          recomputeActivityStatusesForAccount(
            mutation.rollbackData.id,
            mutation.rollbackData.movements,
          );
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
        } else if (mutation.name === "addTransaction") {
          get().deleteTransaction(
            mutation.variables.activityId,
            mutation.variables.id,
          );
        } else if (mutation.name === "updateTransaction") {
          get().updateTransaction(
            mutation.variables.activityId,
            mutation.variables.id,
            mutation.rollbackData,
          );
        } else if (mutation.name === "deleteTransaction") {
          get().addTransaction(
            mutation.variables.activityId,
            mutation.rollbackData,
          );
        } else if (mutation.name === "createMovementActivity") {
          get().deleteActivityMovement(
            mutation.variables.activityId,
            mutation.variables.id,
          );
        } else if (mutation.name === "updateMovementActivity") {
          get().updateActivityMovement(
            mutation.rollbackData.activity,
            mutation.variables.id,
            mutation.rollbackData,
          );
        } else if (mutation.name === "deleteMovementActivity") {
          get().addActivityMovement(
            mutation.rollbackData.activity,
            mutation.rollbackData,
          );
        }
      },
    }),
    {
      name: "activities",
      version: 1,
      storage: storage,
      migrate: (persisted) => {
        const state = persisted as { activities?: Activity[] };
        if (state.activities) {
          state.activities = state.activities.map((activity) =>
            activity.history ? activity : { ...activity, history: [] },
          );
        }
        migrationFlags.refetchUserData = true;
        return state;
      },
    },
  ),
);
