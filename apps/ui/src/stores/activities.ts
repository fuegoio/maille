import dayjs from "dayjs";
import { defineStore } from "pinia";
import type { UUID } from "crypto";
import { ref } from "vue";
import {
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type ActivityMovement,
} from "@maille/core/activities";
import {
  type Activity,
  type ActivityCategory,
  type ActivitySubCategory,
  type Transaction,
  ActivityType,
} from "@maille/core/activities";
import { useMovementsStore } from "./movements";
import { useViewsStore } from "./views";
import { useStorage } from "@vueuse/core";
import type { Movement, MovementActivity } from "@maille/core/movements";
import { useAccountsStore } from "./accounts";
import type { SyncEvent } from "@maille/core/sync";
import { type Mutation } from "@/mutations";
import { useLiabilitiesStore } from "./liabilities";
import { AccountType } from "@maille/core/accounts";

export const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red", // "bg-red-300"
  [ActivityType.REVENUE]: "green", // "bg-green-300"
  [ActivityType.INVESTMENT]: "orange", // "bg-orange-300"
  [ActivityType.NEUTRAL]: "slate", // "bg-slate-300"
};

export const ACTIVITY_TYPES_NAME = {
  [ActivityType.EXPENSE]: "Expense",
  [ActivityType.REVENUE]: "Revenue",
  [ActivityType.INVESTMENT]: "Investment",
  [ActivityType.NEUTRAL]: "Neutral",
};

export const useActivitiesStore = defineStore("activities", () => {
  const accountsStore = useAccountsStore();
  const { getMovementById } = useMovementsStore();

  const activities = useStorage<Activity[]>("activities", [], undefined, {
    serializer: {
      read: (v: string) => {
        if (!v) return null;
        return JSON.parse(v).map((a: any) => {
          return {
            ...a,
            date: dayjs(a.date),
          };
        });
      },
      write: (v: Activity[]) => JSON.stringify(v),
    },
  });
  const categories = useStorage<ActivityCategory[]>("activity_categories", []);
  const subcategories = useStorage<ActivitySubCategory[]>(
    "activity_subcategories",
    [],
  );

  const showTransactions = ref(false);

  const focusedActivity = ref<UUID | null>(null);

  const getActivityById = (activityId: UUID): Activity | undefined => {
    return activities.value.find((a) => a.id === activityId);
  };

  const getActivityByNumber = (
    activityNumber: number,
  ): Activity | undefined => {
    return activities.value.find((a) => a.number === activityNumber);
  };

  const createActivity = (input: {
    name: string;
    description: string | null;
    date: dayjs.Dayjs;
    type: ActivityType;
    category: UUID | null;
    subcategory: UUID | null;
    project: UUID | null;
    transactions: {
      fromAccount: UUID | null;
      fromUser: UUID | null;
      toAccount: UUID | null;
      toUser: UUID | null;
      amount: number;
    }[];
    movement?: Movement;
  }): Activity => {
    const transactions = input.transactions.map((t) => {
      return {
        id: window.crypto.randomUUID(),
        ...t,
      };
    });
    const movements = [];
    if (input.movement) {
      movements.push({
        id: window.crypto.randomUUID(),
        amount: input.movement.amount,
        movement: input.movement.id,
      });
    }

    const liabilitiesByAccount: { accountId: UUID; amount: number }[] = [];
    input.transactions.forEach((transaction) => {
      const fromAccount = accountsStore.accounts.find(
        (account) =>
          account.type === AccountType.LIABILITIES &&
          account.id === transaction.fromAccount,
      );
      const toAccount = accountsStore.accounts.find(
        (account) =>
          account.type === AccountType.LIABILITIES &&
          account.id === transaction.toAccount,
      );

      if (fromAccount) {
        const existingLiability = liabilitiesByAccount.find(
          (liability) => liability.accountId === fromAccount.id,
        );
        if (existingLiability) {
          existingLiability.amount -= transaction.amount;
        } else {
          liabilitiesByAccount.push({
            accountId: fromAccount.id,
            amount: -transaction.amount,
          });
        }
      }

      if (toAccount) {
        const existingLiability = liabilitiesByAccount.find(
          (liability) => liability.accountId === toAccount.id,
        );
        if (existingLiability) {
          existingLiability.amount += transaction.amount;
        } else {
          liabilitiesByAccount.push({
            accountId: toAccount.id,
            amount: transaction.amount,
          });
        }
      }
    });

    return addActivity({
      ...input,
      id: window.crypto.randomUUID(),
      number: Math.max(...activities.value.map((a) => a.number)) + 1,
      transactions,
      movements,
      liabilities: liabilitiesByAccount.map((liability) => ({
        account: liability.accountId,
        amount: liability.amount,
        id: window.crypto.randomUUID(),
      })),
    });
  };

  const addActivity = (input: {
    id: UUID;
    number: number;
    name: string;
    description: string | null;
    date: dayjs.Dayjs;
    type: ActivityType;
    category: UUID | null;
    subcategory: UUID | null;
    project: UUID | null;
    transactions: Transaction[];
    movements: ActivityMovement[];
    liabilities: {
      account: UUID;
      amount: number;
      id: UUID;
    }[];
  }) => {
    const activity: Activity = {
      ...input,
      amount: getActivityTransactionsReconciliationSum(
        input.type,
        input.transactions,
        accountsStore.accounts,
      ),
      status: getActivityStatus(
        input.date,
        input.transactions,
        input.movements,
        accountsStore.accounts,
        getMovementById,
      ),
    };

    const liabilitiesStore = useLiabilitiesStore();
    input.liabilities.forEach((liability) => {
      liabilitiesStore.addLiability({
        amount: liability.amount,
        activity: activity,
        account: liability.account,
        id: liability.id,
      });
    });

    activities.value.push(activity);

    const movementStore = useMovementsStore();
    input.movements.forEach((m) => {
      movementStore.addActivityMovementToMovement(activity.id, m);
    });

    return activity;
  };

  const updateActivity = (
    activityId: UUID,
    update: {
      name?: string;
      description?: string | null;
      date?: dayjs.Dayjs;
      type?: ActivityType;
      category?: UUID | null;
      subcategory?: UUID | null;
      project?: UUID | null;
    },
  ): Activity => {
    const activity = getActivityById(activityId);
    if (!activity) throw Error("activity not found");

    if (update.name !== undefined) {
      activity.name = update.name;
    }
    if (update.description !== undefined) {
      activity.description = update.description;
    }
    if (update.date !== undefined) {
      activity.date = update.date;
    }
    if (update.type !== undefined) {
      activity.type = update.type;
      activity.category = null;
      activity.subcategory = null;
    }
    if (update.category !== undefined) {
      activity.category = update.category;
      activity.subcategory = null;
    }
    if (update.subcategory !== undefined) {
      activity.subcategory = update.subcategory;
    }
    if (update.project !== undefined) {
      activity.project = update.project;
    }

    activity.amount = getActivityTransactionsReconciliationSum(
      activity.type,
      activity.transactions,
      accountsStore.accounts,
    );
    activity.status = getActivityStatus(
      activity.date,
      activity.transactions,
      activity.movements,
      accountsStore.accounts,
      getMovementById,
    );

    return activity;
  };

  const deleteActivity = (activityId: UUID) => {
    const activity = getActivityById(activityId);
    if (!activity) throw Error("activity not found");

    const movementStore = useMovementsStore();
    activity.movements.forEach((movementActivity) => {
      const movement = movementStore.movements.find(
        (m) => m.id === movementActivity.movement,
      );
      if (!movement) return;

      movement.activities = movement.activities.filter(
        (ma) => ma.id !== movementActivity.id,
      );
      movement.status =
        movement.activities.reduce((sum, ma) => sum + ma.amount, 0) ===
        movement.amount
          ? "completed"
          : "incomplete";
    });

    activities.value.splice(activities.value.indexOf(activity), 1);

    const liabilitiesStore = useLiabilitiesStore();
    liabilitiesStore.deleteLiabilitiesActivity(activity.id);
    return { activity };
  };

  const restoreActivity = (activity: Activity) => {
    activities.value.push(activity);

    const movementStore = useMovementsStore();
    activity.movements.forEach((movementActivity) => {
      movementStore.addActivityMovementToMovement(
        activity.id,
        movementActivity,
      );
    });
  };

  const addMovementActivityToActivity = (
    movementId: UUID,
    movementActivity: MovementActivity,
  ) => {
    const activity = getActivityById(movementActivity.activity);
    if (!activity) return;

    activity.movements.push({
      id: movementActivity.id,
      amount: movementActivity.amount,
      movement: movementId,
    });
    activity.status = getActivityStatus(
      activity.date,
      activity.transactions,
      activity.movements,
      accountsStore.accounts,
      getMovementById,
    );
  };

  const updateMovementActivityFromActivity = (
    activityId: UUID,
    movementActivityId: UUID,
    amount: number,
  ) => {
    const activity = getActivityById(activityId);
    if (!activity) return;

    const movementActivity = activity.movements.find(
      (ma) => ma.id === movementActivityId,
    );
    if (!movementActivity) return;

    movementActivity.amount = amount;
    activity.status = getActivityStatus(
      activity.date,
      activity.transactions,
      activity.movements,
      accountsStore.accounts,
      getMovementById,
    );
  };

  const deleteMovementActivityFromActivity = (
    activityId: UUID,
    movementActivityId: UUID,
  ) => {
    const activity = getActivityById(activityId);
    if (!activity) return;

    activity.movements = activity.movements.filter(
      (ma) => ma.id !== movementActivityId,
    );
    activity.status = getActivityStatus(
      activity.date,
      activity.transactions,
      activity.movements,
      accountsStore.accounts,
      getMovementById,
    );
  };

  // Transactions
  const addNewTransaction = (
    activityId: UUID,
    amount: number,
    from: UUID,
    to: UUID,
    transactionId?: UUID,
  ): Transaction => {
    const activity = getActivityById(activityId);
    if (!activity) throw Error("activity not found");

    const transaction = {
      id: transactionId ?? window.crypto.randomUUID(),
      amount: amount,
      fromAccount: from,
      toAccount: to,
    };

    activity.transactions.push(transaction);
    activity.amount = getActivityTransactionsReconciliationSum(
      activity.type,
      activity.transactions,
      accountsStore.accounts,
    );
    activity.status = getActivityStatus(
      activity.date,
      activity.transactions,
      activity.movements,
      accountsStore.accounts,
      getMovementById,
    );

    const liabilitiesStore = useLiabilitiesStore();
    const fromAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES && account.id === from,
    );
    const toAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES && account.id === to,
    );

    if (fromAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        from,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount = existingLiability.amount - amount;
      } else {
        liabilitiesStore.addLiability({
          amount: -amount,
          activity: activity,
          account: from,
          id: window.crypto.randomUUID(),
        });
      }
    }

    if (toAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        toAccount.id,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount += amount;
      } else {
        liabilitiesStore.addLiability({
          amount: amount,
          activity: activity,
          account: toAccount.id,
          id: window.crypto.randomUUID(),
        });
      }
    }

    return transaction;
  };

  const updateTransaction = (
    activityId: UUID,
    transactionId: UUID,
    update: {
      amount?: number;
      fromAccount?: UUID;
      toAccount?: UUID;
    },
  ) => {
    const activity = getActivityById(activityId);
    if (!activity) throw Error("activity not found");

    const transaction = activity.transactions.find(
      (t) => t.id === transactionId,
    );
    if (!transaction) throw Error("transaction not found");

    // Liabilities cleaning
    const liabilitiesStore = useLiabilitiesStore();
    const oldFromAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES &&
        account.id === transaction.fromAccount,
    );
    const oldToAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES &&
        account.id === transaction.toAccount,
    );

    if (oldFromAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        oldFromAccount.id,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount += transaction.amount;
      }
    }
    if (oldToAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        oldToAccount.id,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount -= transaction.amount;
      }
    }

    // Update transaction
    if (update.amount !== undefined) {
      transaction.amount = update.amount;
    }
    if (update.fromAccount !== undefined) {
      transaction.fromAccount = update.fromAccount;
    }
    if (update.toAccount !== undefined) {
      transaction.toAccount = update.toAccount;
    }
    activity.amount = getActivityTransactionsReconciliationSum(
      activity.type,
      activity.transactions,
      accountsStore.accounts,
    );
    activity.status = getActivityStatus(
      activity.date,
      activity.transactions,
      activity.movements,
      accountsStore.accounts,
      getMovementById,
    );

    // Liabilities
    const newFromAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES &&
        account.id === transaction.fromAccount,
    );
    const newToAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES &&
        account.id === transaction.toAccount,
    );
    if (newFromAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        newFromAccount.id,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount -= transaction.amount;
      } else {
        liabilitiesStore.addLiability({
          amount: -transaction.amount,
          activity: activity,
          account: newFromAccount.id,
          id: window.crypto.randomUUID(),
        });
      }
    }

    if (newToAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        newToAccount.id,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount += transaction.amount;
      } else {
        liabilitiesStore.addLiability({
          amount: transaction.amount,
          activity: activity,
          account: newToAccount.id,
          id: window.crypto.randomUUID(),
        });
      }
    }

    return transaction;
  };

  const deleteTransaction = (activityId: UUID, transactionId: UUID) => {
    const activity = getActivityById(activityId);
    if (!activity) throw Error("activity not found");

    const transaction = activity.transactions.find(
      (t) => t.id === transactionId,
    );
    if (!transaction) throw Error("transaction not found");

    activity.transactions = activity.transactions.filter(
      (t) => t.id !== transactionId,
    );
    activity.amount = getActivityTransactionsReconciliationSum(
      activity.type,
      activity.transactions,
      accountsStore.accounts,
    );
    activity.status = getActivityStatus(
      activity.date,
      activity.transactions,
      activity.movements,
      accountsStore.accounts,
      getMovementById,
    );

    // Liabilities
    const liabilitiesStore = useLiabilitiesStore();
    const fromAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES &&
        account.id === transaction.fromAccount,
    );
    const toAccount = accountsStore.accounts.find(
      (account) =>
        account.type === AccountType.LIABILITIES &&
        account.id === transaction.toAccount,
    );

    if (fromAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        fromAccount.id,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount += transaction.amount;
      }
    }

    if (toAccount) {
      const existingLiability = liabilitiesStore.getLiability(
        toAccount.id,
        activity.id,
      );
      if (existingLiability) {
        existingLiability.amount -= transaction.amount;
      }
    }
  };

  // Categories
  const createCategory = (
    name: string,
    type: ActivityType,
  ): ActivityCategory => {
    const newCategory = {
      id: window.crypto.randomUUID(),
      name,
      type,
    };

    return addCategory(newCategory);
  };

  const addCategory = (category: ActivityCategory) => {
    categories.value.push(category);
    return category;
  };

  const updateCategory = (
    categoryId: UUID,
    update: {
      name?: string;
      type?: ActivityType;
    },
  ) => {
    const category = categories.value.find((c) => c.id === categoryId);
    if (!category) return;

    if (update.name) {
      category.name = update.name;
    }
    if (update.type) {
      category.type = update.type;
    }
  };

  const deleteCategory = (categoryId: UUID) => {
    const category = categories.value.find((c) => c.id === categoryId);
    if (!category) return;

    activities.value
      .filter((a) => a.category === categoryId)
      .forEach((a) => {
        a.category = null;
        a.subcategory = null;
      });

    subcategories.value = subcategories.value.filter(
      (sc) => sc.category !== categoryId,
    );

    useViewsStore().deleteCategory(categoryId);
    categories.value.splice(categories.value.indexOf(category), 1);
  };

  const restoreCategory = (payload: {
    category: ActivityCategory;
    activities: UUID[];
    activitiesSubcategories: Record<UUID, UUID>;
  }) => {
    const category = addCategory(payload.category);
    payload.activities.forEach((activityId) => {
      const activity = getActivityById(activityId);
      if (!activity) return;
      activity.category = category.id;
      activity.subcategory = payload.activitiesSubcategories[activityId];
    });
  };

  const createSubCategory = (
    name: string,
    category: UUID,
  ): ActivitySubCategory => {
    const newSubCategory = {
      id: window.crypto.randomUUID(),
      name,
      category,
    };

    return addSubCategory(newSubCategory);
  };

  const addSubCategory = (subcategory: ActivitySubCategory) => {
    subcategories.value.push(subcategory);
    return subcategory;
  };

  const updateSubCategory = (
    subcategoryId: UUID,
    update: {
      name?: string;
    },
  ) => {
    const subcategory = subcategories.value.find(
      (sc) => sc.id === subcategoryId,
    );
    if (!subcategory) return;

    if (update.name) {
      subcategory.name = update.name;
    }
  };

  const deleteSubCategory = (subcategoryId: UUID) => {
    const subcategory = subcategories.value.find(
      (sc) => sc.id === subcategoryId,
    );
    if (!subcategory) return;

    activities.value
      .filter((a) => a.subcategory === subcategoryId)
      .forEach((a) => {
        a.subcategory = null;
      });

    useViewsStore().deleteSubcategory(subcategoryId);
    subcategories.value.splice(subcategories.value.indexOf(subcategory), 1);
  };

  const restoreSubCategory = (payload: {
    subcategory: ActivitySubCategory;
    activities: UUID[];
  }) => {
    const subcategory = addSubCategory(payload.subcategory);
    payload.activities.forEach((activityId) => {
      const activity = getActivityById(activityId);
      if (!activity) return;
      activity.subcategory = subcategory.id;
    });
  };

  // Events
  const handleEvent = (event: SyncEvent) => {
    if (event.type === "createActivity") {
      addActivity({
        ...event.payload,
        date: dayjs(event.payload.date),
        movements: event.payload.movement ? [event.payload.movement] : [],
        liabilities: event.payload.liabilities,
      });
    } else if (event.type === "updateActivity") {
      updateActivity(event.payload.id, {
        ...event.payload,
        date: event.payload.date ? dayjs(event.payload.date) : undefined,
      });
    } else if (event.type === "deleteActivity") {
      deleteActivity(event.payload.id);
    } else if (event.type === "addTransaction") {
      addNewTransaction(
        event.payload.activityId,
        event.payload.amount,
        event.payload.fromAccount,
        event.payload.toAccount,
        event.payload.id,
      );

      const liabilitiesStore = useLiabilitiesStore();
      liabilitiesStore.updateLiabilitiesLinkId(
        event.payload.activityId,
        event.payload.liabilities,
      );
    } else if (event.type === "updateTransaction") {
      updateTransaction(event.payload.activityId, event.payload.id, {
        amount: event.payload.amount,
        fromAccount: event.payload.fromAccount,
        toAccount: event.payload.toAccount,
      });

      const liabilitiesStore = useLiabilitiesStore();
      liabilitiesStore.updateLiabilitiesLinkId(
        event.payload.activityId,
        event.payload.liabilities,
      );
    } else if (event.type === "deleteTransaction") {
      deleteTransaction(event.payload.activityId, event.payload.id);
    } else if (event.type === "createActivityCategory") {
      addCategory(event.payload);
    } else if (event.type === "updateActivityCategory") {
      updateCategory(event.payload.id, event.payload);
    } else if (event.type === "deleteActivityCategory") {
      deleteCategory(event.payload.id);
    } else if (event.type === "createActivitySubCategory") {
      addSubCategory(event.payload);
    } else if (event.type === "updateActivitySubCategory") {
      updateSubCategory(event.payload.id, event.payload);
    } else if (event.type === "deleteActivitySubCategory") {
      deleteSubCategory(event.payload.id);
    }
  };

  // Mutations
  const handleMutationSuccess = (event: Mutation) => {
    if (!event.result) return;
    if (event.name === "createActivity") {
      const activity = getActivityById(event.result.createActivity.id);
      if (!activity) return;
      activity.number = event.result.createActivity.number;

      if (event.result.createActivity.liabilities) {
        const liabilitiesStore = useLiabilitiesStore();
        liabilitiesStore.updateLiabilitiesLinkId(
          event.result.createActivity.id,
          event.result.createActivity.liabilities,
        );
      }
    }
  };

  const handleMutationError = (event: Mutation) => {
    if (event.name === "createActivity") {
      deleteActivity(event.variables.id);
    } else if (event.name === "updateActivity") {
      updateActivity(event.variables.id, {
        ...event.rollbackData,
        date: dayjs(event.rollbackData.date),
        type: event.rollbackData.type as ActivityType,
      });
    } else if (event.name === "deleteActivity") {
      restoreActivity(event.rollbackData);
    } else if (event.name === "addTransaction") {
      deleteTransaction(event.variables.activityId, event.variables.id);
    } else if (event.name === "updateTransaction") {
      updateTransaction(event.variables.activityId, event.variables.id, {
        amount: event.rollbackData.amount,
        fromAccount: event.rollbackData.fromAccount,
        toAccount: event.rollbackData.toAccount,
      });
    } else if (event.name === "deleteTransaction") {
      addNewTransaction(
        event.variables.activityId,
        event.rollbackData.amount,
        event.rollbackData.fromAccount,
        event.rollbackData.toAccount,
        event.rollbackData.id,
      );
    } else if (event.name === "createActivityCategory") {
      deleteCategory(event.variables.id);
    } else if (event.name === "updateActivityCategory") {
      updateCategory(event.variables.id, event.rollbackData);
    } else if (event.name === "deleteActivityCategory") {
      restoreCategory(event.rollbackData);
    } else if (event.name === "createActivitySubCategory") {
      deleteSubCategory(event.variables.id);
    } else if (event.name === "updateActivitySubCategory") {
      updateSubCategory(event.variables.id, event.rollbackData);
    } else if (event.name === "deleteActivitySubCategory") {
      restoreSubCategory(event.rollbackData);
    }
  };

  return {
    activities,
    categories,
    subcategories,
    showTransactions,

    getActivityById,
    getActivityByNumber,

    createActivity,
    updateActivity,
    deleteActivity,
    restoreActivity,
    addMovementActivityToActivity,
    updateMovementActivityFromActivity,
    deleteMovementActivityFromActivity,

    focusedActivity,

    addNewTransaction,
    updateTransaction,
    deleteTransaction,

    createCategory,
    createSubCategory,
    deleteCategory,
    deleteSubCategory,

    handleEvent,
    handleMutationSuccess,
    handleMutationError,
  };
});
