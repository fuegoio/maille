import type { Account, AccountType } from "#accounts/index.js";
import type { ActivityType, Transaction } from "#activities/types.ts";

export interface BaseSyncEvent {
  user: string;
  workspace: string;
  createdAt: Date;
  clientId: string;
}

export interface CreateActivityEvent extends BaseSyncEvent {
  type: "createActivity";
  payload: {
    id: string;
    number: number;
    user: string;
    name: string;
    description: string | null;
    date: string;
    type: ActivityType;
    category: string | null;
    subcategory: string | null;
    project: string | null;
    transactions: Transaction[];
    movement?: {
      id: string;
      amount: number;
      movement: string;
    };
  };
}

export interface UpdateActivityEvent extends BaseSyncEvent {
  type: "updateActivity";
  payload: {
    id: string;
    name?: string;
    users?: string[];
    description?: string | null;
    date?: string;
    type?: ActivityType;
    category?: string | null;
    subcategory?: string | null;
    project?: string | null;
  };
}

export interface DeleteActivityEvent extends BaseSyncEvent {
  type: "deleteActivity";
  payload: {
    id: string;
  };
}

export interface AddTransactionEvent extends BaseSyncEvent {
  type: "addTransaction";
  payload: Transaction & {
    activityId: string;
  };
}

export interface UpdateTransactionEvent extends BaseSyncEvent {
  type: "updateTransaction";
  payload: {
    activityId: string;
    id: string;
  } & Partial<Omit<Transaction, "id">>;
}

export interface DeleteTransactionEvent extends BaseSyncEvent {
  type: "deleteTransaction";
  payload: {
    activityId: string;
    id: string;
  };
}

export interface CreateMovementEvent extends BaseSyncEvent {
  type: "createMovement";
  payload: {
    id: string;
    name: string;
    date: string;
    amount: number;
    account: string;
  };
}

export interface UpdateMovementEvent extends BaseSyncEvent {
  type: "updateMovement";
  payload: {
    id: string;
    date?: string;
    amount?: number;
  };
}

export interface DeleteMovementEvent extends BaseSyncEvent {
  type: "deleteMovement";
  payload: {
    id: string;
  };
}

export interface CreateMovementActivityEvent extends BaseSyncEvent {
  type: "createMovementActivity";
  payload: {
    id: string;
    movement: string;
    activity: string;
    amount: number;
  };
}

export interface UpdateMovementActivityEvent extends BaseSyncEvent {
  type: "updateMovementActivity";
  payload: {
    id: string;
    activity: string;
    movement: string;
    amount: number;
  };
}

export interface DeleteMovementActivityEvent extends BaseSyncEvent {
  type: "deleteMovementActivity";
  payload: {
    id: string;
    activity: string;
    movement: string;
  };
}

export interface CreateActivityCategoryEvent extends BaseSyncEvent {
  type: "createActivityCategory";
  payload: {
    id: string;
    name: string;
    type: ActivityType;
  };
}

export interface UpdateActivityCategoryEvent extends BaseSyncEvent {
  type: "updateActivityCategory";
  payload: {
    id: string;
    name: string;
  };
}

export interface DeleteActivityCategoryEvent extends BaseSyncEvent {
  type: "deleteActivityCategory";
  payload: {
    id: string;
  };
}

export interface CreateActivitySubCategoryEvent extends BaseSyncEvent {
  type: "createActivitySubCategory";
  payload: {
    id: string;
    name: string;
    category: string;
  };
}

export interface UpdateActivitySubCategoryEvent extends BaseSyncEvent {
  type: "updateActivitySubCategory";
  payload: {
    id: string;
    name: string;
  };
}

export interface DeleteActivitySubCategoryEvent extends BaseSyncEvent {
  type: "deleteActivitySubCategory";
  payload: {
    id: string;
  };
}

export interface CreateProjectEvent extends BaseSyncEvent {
  type: "createProject";
  payload: {
    id: string;
    name: string;
    emoji: string | null;
  };
}

export interface UpdateProjectEvent extends BaseSyncEvent {
  type: "updateProject";
  payload: {
    id: string;
    name?: string;
    emoji?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
}

export interface DeleteProjectEvent extends BaseSyncEvent {
  type: "deleteProject";
  payload: {
    id: string;
  };
}

export interface CreateAccountEvent extends BaseSyncEvent {
  type: "createAccount";
  payload: {
    id: string;
    name: string;
    type: AccountType;
  };
}

export interface UpdateAccountEvent extends BaseSyncEvent {
  type: "updateAccount";
  payload: {
    id: string;
    name?: string;
    startingBalance?: number | null;
    startingCashBalance?: number | null;
    movements?: boolean;
  };
}

export interface DeleteAccountEvent extends BaseSyncEvent {
  type: "deleteAccount";
  payload: {
    id: string;
  };
}

export interface CreateUserEvent extends BaseSyncEvent {
  type: "createUser";
  payload: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accounts: Account[];
  };
}

export interface UpdateUserEvent extends BaseSyncEvent {
  type: "updateUser";
  payload: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
  };
}

export type SyncEvent =
  | CreateActivityEvent
  | UpdateActivityEvent
  | DeleteActivityEvent
  | AddTransactionEvent
  | UpdateTransactionEvent
  | DeleteTransactionEvent
  | CreateMovementEvent
  | UpdateMovementEvent
  | DeleteMovementEvent
  | CreateMovementActivityEvent
  | UpdateMovementActivityEvent
  | DeleteMovementActivityEvent
  | CreateActivityCategoryEvent
  | UpdateActivityCategoryEvent
  | DeleteActivityCategoryEvent
  | CreateActivitySubCategoryEvent
  | UpdateActivitySubCategoryEvent
  | DeleteActivitySubCategoryEvent
  | CreateProjectEvent
  | UpdateProjectEvent
  | DeleteProjectEvent
  | CreateAccountEvent
  | UpdateAccountEvent
  | DeleteAccountEvent
  | CreateUserEvent
  | UpdateUserEvent;
