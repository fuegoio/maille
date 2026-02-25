import type { Account, AccountSharing, AccountType } from "#accounts/index.ts";
import type { ActivitySharing, ActivityType, Transaction } from "#activities/types.ts";
import type { ContactUser } from "#contacts/index.ts";

export interface BaseSyncEvent {
  user: string;
  createdAt: Date;
  clientId: string;
}

export interface CreateActivityEvent extends BaseSyncEvent {
  type: "createActivity";
  payload: {
    id: string;
    number: number;
    name: string;
    description: string | null;
    date: string;
    type: ActivityType;
    category: string | null;
    subcategory: string | null;
    project: string | null;
    transactions: Omit<Transaction, "user">[];
    movement?: {
      id: string;
      amount: number;
      movement: string;
    };
    sharing?: ActivitySharing[];
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
  } & Partial<Omit<Transaction, "id" | "user">>;
}

export interface DeleteTransactionEvent extends BaseSyncEvent {
  type: "deleteTransaction";
  payload: {
    activityId: string;
    id: string;
  };
}

export interface UpdateActivitySharing extends BaseSyncEvent {
  type: "updateActivitySharing";
  payload: {
    activityId: string;
    sharing: ActivitySharing[];
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
    emoji: string | null;
  };
}

export interface UpdateActivityCategoryEvent extends BaseSyncEvent {
  type: "updateActivityCategory";
  payload: {
    id: string;
    name: string;
    emoji?: string | null;
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
    emoji: string | null;
  };
}

export interface UpdateActivitySubCategoryEvent extends BaseSyncEvent {
  type: "updateActivitySubCategory";
  payload: {
    id: string;
    name: string;
    emoji?: string | null;
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
    startingBalance: number | null;
    startingCashBalance: number | null;
    movements: boolean;
    sharing?: AccountSharing[];
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
    sharing?: AccountSharing[];
  };
}

export interface DeleteAccountEvent extends BaseSyncEvent {
  type: "deleteAccount";
  payload: {
    id: string;
  };
}

export interface CreateAssetEvent extends BaseSyncEvent {
  type: "createAsset";
  payload: {
    id: string;
    account: string;
    name: string;
    description: string | null;
    location: string | null;
  };
}

export interface UpdateAssetEvent extends BaseSyncEvent {
  type: "updateAsset";
  payload: {
    id: string;
    account?: string;
    name?: string;
    description?: string | null;
    location?: string | null;
  };
}

export interface DeleteAssetEvent extends BaseSyncEvent {
  type: "deleteAsset";
  payload: {
    id: string;
  };
}

export interface CreateCounterpartyEvent extends BaseSyncEvent {
  type: "createCounterparty";
  payload: {
    id: string;
    account: string;
    name: string;
    description: string | null;
    contact: string | null;
  };
}

export interface UpdateCounterpartyEvent extends BaseSyncEvent {
  type: "updateCounterparty";
  payload: {
    id: string;
    name?: string;
    description?: string | null;
    contact?: string | null;
  };
}

export interface DeleteCounterpartyEvent extends BaseSyncEvent {
  type: "deleteCounterparty";
  payload: {
    id: string;
  };
}

export interface CreateContactEvent extends BaseSyncEvent {
  type: "createContact";
  payload: {
    id: string;
    contact: ContactUser;
  };
}

export interface DeleteContactEvent extends BaseSyncEvent {
  type: "deleteContact";
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
  | UpdateActivitySharing
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
  | CreateAssetEvent
  | UpdateAssetEvent
  | DeleteAssetEvent
  | CreateCounterpartyEvent
  | UpdateCounterpartyEvent
  | DeleteCounterpartyEvent
  | CreateContactEvent
  | DeleteContactEvent
  | CreateUserEvent
  | UpdateUserEvent;
