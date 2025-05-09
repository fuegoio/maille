import type { Account, AccountType } from "#accounts/types.js";
import type { ActivityType } from "#activities/types.ts";
import type { Liability } from "#liabilities/types.ts";
import type { UUID } from "crypto";

export type CreateActivityEvent = {
  type: "createActivity";
  payload: {
    id: UUID;
    number: number;
    name: string;
    description: string | null;
    date: string;
    type: ActivityType;
    category: UUID | null;
    subcategory: UUID | null;
    project: UUID | null;
    transactions: {
      id: UUID;
      fromAccount: UUID;
      toAccount: UUID;
      amount: number;
    }[];
    movement?: {
      id: UUID;
      amount: number;
      movement: UUID;
    };
    liabilities: Liability[];
  };
};

export type UpdateActivityEvent = {
  type: "updateActivity";
  payload: {
    id: UUID;
    name?: string;
    description?: string | null;
    date?: string;
    type?: ActivityType;
    category?: UUID | null;
    subcategory?: UUID | null;
    project?: UUID | null;
  };
};

export type DeleteActivityEvent = {
  type: "deleteActivity";
  payload: {
    id: UUID;
  };
};

export type AddTransactionEvent = {
  type: "addTransaction";
  payload: {
    activityId: UUID;
    id: UUID;
    amount: number;
    fromAccount: UUID;
    toAccount: UUID;
    liabilities: Liability[];
  };
};

export type UpdateTransactionEvent = {
  type: "updateTransaction";
  payload: {
    activityId: UUID;
    id: UUID;
    amount?: number;
    fromAccount?: UUID;
    toAccount?: UUID;
    liabilities: Liability[];
  };
};

export type DeleteTransactionEvent = {
  type: "deleteTransaction";
  payload: {
    activityId: UUID;
    id: UUID;
  };
};

export type CreateMovementEvent = {
  type: "createMovement";
  payload: {
    id: UUID;
    name: string;
    date: string;
    amount: number;
    account: UUID;
  };
};

export type UpdateMovementEvent = {
  type: "updateMovement";
  payload: {
    id: UUID;
    date?: string;
    amount?: number;
  };
};

export type DeleteMovementEvent = {
  type: "deleteMovement";
  payload: {
    id: UUID;
  };
};

export type CreateMovementActivityEvent = {
  type: "createMovementActivity";
  payload: {
    id: UUID;
    movement: UUID;
    activity: UUID;
    amount: number;
  };
};

export type UpdateMovementActivityEvent = {
  type: "updateMovementActivity";
  payload: {
    id: UUID;
    movement: UUID;
    amount: number;
  };
};

export type DeleteMovementActivityEvent = {
  type: "deleteMovementActivity";
  payload: {
    id: UUID;
    movement: UUID;
  };
};

export type CreateActivityCategoryEvent = {
  type: "createActivityCategory";
  payload: {
    id: UUID;
    name: string;
    type: ActivityType;
  };
};

export type UpdateActivityCategoryEvent = {
  type: "updateActivityCategory";
  payload: {
    id: UUID;
    name: string;
  };
};

export type DeleteActivityCategoryEvent = {
  type: "deleteActivityCategory";
  payload: {
    id: UUID;
  };
};

export type CreateActivitySubCategoryEvent = {
  type: "createActivitySubCategory";
  payload: {
    id: UUID;
    name: string;
    category: UUID;
  };
};

export type UpdateActivitySubCategoryEvent = {
  type: "updateActivitySubCategory";
  payload: {
    id: UUID;
    name: string;
  };
};

export type DeleteActivitySubCategoryEvent = {
  type: "deleteActivitySubCategory";
  payload: {
    id: UUID;
  };
};

export type CreateProjectEvent = {
  type: "createProject";
  payload: {
    id: UUID;
    name: string;
    emoji: string | null;
  };
};

export type UpdateProjectEvent = {
  type: "updateProject";
  payload: {
    id: UUID;
    name?: string;
    emoji?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
};

export type DeleteProjectEvent = {
  type: "deleteProject";
  payload: {
    id: UUID;
  };
};

export type CreateAccountEvent = {
  type: "createAccount";
  payload: {
    id: UUID;
    name: string;
    type: AccountType;
  };
};

export type UpdateAccountEvent = {
  type: "updateAccount";
  payload: {
    id: UUID;
    startingBalance?: number | null;
    startingCashBalance?: number | null;
    movements?: boolean;
  };
};

export type DeleteAccountEvent = {
  type: "deleteAccount";
  payload: {
    id: UUID;
  };
};

type BaseSyncEvent = {
  createdAt: Date;
  clientId: UUID;
};

export type SyncEvent = BaseSyncEvent &
  (
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
  );
