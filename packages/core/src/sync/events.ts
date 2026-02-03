import type { Account, AccountType } from "#accounts/index.js";
import type { ActivityType, Transaction } from "#activities/types.ts";
import type { UUID } from "crypto";

export interface BaseSyncEvent {
  user: string;
  createdAt: Date;
  clientId: string;
}

export interface CreateActivityEvent extends BaseSyncEvent {
  type: "createActivity";
  payload: {
    id: UUID;
    number: number;
    user: string;
    name: string;
    description: string | null;
    date: string;
    type: ActivityType;
    category: UUID | null;
    subcategory: UUID | null;
    project: UUID | null;
    transactions: Transaction[];
    movement?: {
      id: UUID;
      amount: number;
      movement: UUID;
    };
  };
}

export interface UpdateActivityEvent extends BaseSyncEvent {
  type: "updateActivity";
  payload: {
    id: UUID;
    name?: string;
    users?: UUID[];
    description?: string | null;
    date?: string;
    type?: ActivityType;
    category?: UUID | null;
    subcategory?: UUID | null;
    project?: UUID | null;
  };
}

export interface DeleteActivityEvent extends BaseSyncEvent {
  type: "deleteActivity";
  payload: {
    id: UUID;
  };
}

export interface AddTransactionEvent extends BaseSyncEvent {
  type: "addTransaction";
  payload: Transaction & {
    activityId: UUID;
  };
}

export interface UpdateTransactionEvent extends BaseSyncEvent {
  type: "updateTransaction";
  payload: {
    activityId: UUID;
    id: UUID;
  } & Partial<Omit<Transaction, "id">>;
}

export interface DeleteTransactionEvent extends BaseSyncEvent {
  type: "deleteTransaction";
  payload: {
    activityId: UUID;
    id: UUID;
  };
}

export interface CreateMovementEvent extends BaseSyncEvent {
  type: "createMovement";
  payload: {
    id: UUID;
    name: string;
    date: string;
    amount: number;
    account: UUID;
  };
}

export interface UpdateMovementEvent extends BaseSyncEvent {
  type: "updateMovement";
  payload: {
    id: UUID;
    date?: string;
    amount?: number;
  };
}

export interface DeleteMovementEvent extends BaseSyncEvent {
  type: "deleteMovement";
  payload: {
    id: UUID;
  };
}

export interface CreateMovementActivityEvent extends BaseSyncEvent {
  type: "createMovementActivity";
  payload: {
    id: UUID;
    movement: UUID;
    activity: UUID;
    amount: number;
  };
}

export interface UpdateMovementActivityEvent extends BaseSyncEvent {
  type: "updateMovementActivity";
  payload: {
    id: UUID;
    movement: UUID;
    amount: number;
  };
}

export interface DeleteMovementActivityEvent extends BaseSyncEvent {
  type: "deleteMovementActivity";
  payload: {
    id: UUID;
    movement: UUID;
  };
}

export interface CreateActivityCategoryEvent extends BaseSyncEvent {
  type: "createActivityCategory";
  payload: {
    id: UUID;
    name: string;
    type: ActivityType;
  };
}

export interface UpdateActivityCategoryEvent extends BaseSyncEvent {
  type: "updateActivityCategory";
  payload: {
    id: UUID;
    name: string;
  };
}

export interface DeleteActivityCategoryEvent extends BaseSyncEvent {
  type: "deleteActivityCategory";
  payload: {
    id: UUID;
  };
}

export interface CreateActivitySubCategoryEvent extends BaseSyncEvent {
  type: "createActivitySubCategory";
  payload: {
    id: UUID;
    name: string;
    category: UUID;
  };
}

export interface UpdateActivitySubCategoryEvent extends BaseSyncEvent {
  type: "updateActivitySubCategory";
  payload: {
    id: UUID;
    name: string;
  };
}

export interface DeleteActivitySubCategoryEvent extends BaseSyncEvent {
  type: "deleteActivitySubCategory";
  payload: {
    id: UUID;
  };
}

export interface CreateProjectEvent extends BaseSyncEvent {
  type: "createProject";
  payload: {
    id: UUID;
    name: string;
    emoji: string | null;
  };
}

export interface UpdateProjectEvent extends BaseSyncEvent {
  type: "updateProject";
  payload: {
    id: UUID;
    name?: string;
    emoji?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
}

export interface DeleteProjectEvent extends BaseSyncEvent {
  type: "deleteProject";
  payload: {
    id: UUID;
  };
}

export interface CreateAccountEvent extends BaseSyncEvent {
  type: "createAccount";
  payload: {
    id: UUID;
    name: string;
    type: AccountType;
  };
}

export interface UpdateAccountEvent extends BaseSyncEvent {
  type: "updateAccount";
  payload: {
    id: UUID;
    startingBalance?: number | null;
    startingCashBalance?: number | null;
    movements?: boolean;
  };
}

export interface DeleteAccountEvent extends BaseSyncEvent {
  type: "deleteAccount";
  payload: {
    id: UUID;
  };
}

export interface CreateUserEvent extends BaseSyncEvent {
  type: "createUser";
  payload: {
    id: UUID;
    email: string;
    firstName: string;
    lastName: string;
    accounts: Account[];
  };
}

export interface UpdateUserEvent extends BaseSyncEvent {
  type: "updateUser";
  payload: {
    id: UUID;
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
