import type {
  Activity,
  ActivityCategory,
  ActivitySubCategory,
  Transaction,
} from "@maille/core/activities";
import type {
  AddTransactionEvent,
  CreateActivityCategoryEvent,
  CreateActivityEvent,
  CreateActivitySubCategoryEvent,
  DeleteActivityCategoryEvent,
  DeleteActivityEvent,
  DeleteActivitySubCategoryEvent,
  DeleteTransactionEvent,
  UpdateActivityCategoryEvent,
  UpdateActivityEvent,
  UpdateActivitySharing,
  UpdateActivitySubCategoryEvent,
  UpdateTransactionEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createActivityMutation = graphql(/* GraphQL */ `
  mutation CreateActivity(
    $category: String
    $date: Date!
    $description: String
    $id: String!
    $movement: ActivityMovementInput
    $name: String!
    $project: String
    $subcategory: String
    $transactions: [TransactionInput!]
    $type: String!
  ) {
    createActivity(
      category: $category
      date: $date
      description: $description
      id: $id
      movement: $movement
      name: $name
      project: $project
      subcategory: $subcategory
      transactions: $transactions
      type: $type
    ) {
      id
      number
    }
  }
`);

export const updateActivityMutation = graphql(/* GraphQL */ `
  mutation UpdateActivity(
    $id: String!
    $category: String
    $date: Date
    $description: String
    $name: String
    $project: String
    $subcategory: String
    $type: String
  ) {
    updateActivity(
      id: $id
      category: $category
      date: $date
      description: $description
      name: $name
      project: $project
      subcategory: $subcategory
      type: $type
    ) {
      id
    }
  }
`);

export const deleteActivityMutation = graphql(/* GraphQL */ `
  mutation DeleteActivity($id: String!) {
    deleteActivity(id: $id) {
      success
    }
  }
`);

export type CreateActivityMutation = MutationType<
  "createActivity",
  typeof createActivityMutation,
  undefined,
  [CreateActivityEvent]
>;

export type UpdateActivityMutation = MutationType<
  "updateActivity",
  typeof updateActivityMutation,
  {
    id: string;
    name: string;
    description: string | null;
    date: string;
    type: string;
    category: string | null;
    subcategory: string | null;
    project: string | null;
  },
  [UpdateActivityEvent]
>;

export type DeleteActivityMutation = MutationType<
  "deleteActivity",
  typeof deleteActivityMutation,
  Activity,
  [DeleteActivityEvent]
>;

export const shareActivityMutation = graphql(/* GraphQL */ `
  mutation ShareActivity(
    $id: String!
    $userId: String!
  ) {
    shareActivity(
      id: $id
      userId: $userId
    ) {
      user
      liability
      accounts {
        account
        amount
      }
    }
  }
`);

export type ShareActivityMutation = MutationType<
  "shareActivity",
  typeof shareActivityMutation,
  undefined,
  [UpdateActivitySharing]
>;

export const addTransactionMutation = graphql(/* GraphQL */ `
  mutation AddTransaction(
    $activityId: String!
    $id: String!
    $amount: Float!
    $fromAccount: String!
    $fromAsset: String
    $fromCounterparty: String
    $toAccount: String!
    $toAsset: String
    $toCounterparty: String
  ) {
    addTransaction(
      activityId: $activityId
      id: $id
      amount: $amount
      fromAccount: $fromAccount
      fromAsset: $fromAsset
      fromCounterparty: $fromCounterparty
      toAccount: $toAccount
      toAsset: $toAsset
      toCounterparty: $toCounterparty
    ) {
      id
    }
  }
`);

export const updateTransactionMutation = graphql(/* GraphQL */ `
  mutation UpdateTransaction(
    $activityId: String!
    $id: String!
    $amount: Float
    $fromAccount: String
    $fromAsset: String
    $fromCounterparty: String
    $toAccount: String
    $toAsset: String
    $toCounterparty: String
  ) {
    updateTransaction(
      activityId: $activityId
      id: $id
      amount: $amount
      fromAccount: $fromAccount
      fromAsset: $fromAsset
      fromCounterparty: $fromCounterparty
      toAccount: $toAccount
      toAsset: $toAsset
      toCounterparty: $toCounterparty
    ) {
      id
    }
  }
`);

export const deleteTransactionMutation = graphql(/* GraphQL */ `
  mutation DeleteTransaction($activityId: String!, $id: String!) {
    deleteTransaction(activityId: $activityId, id: $id) {
      success
    }
  }
`);

export type AddTransactionMutation = MutationType<
  "addTransaction",
  typeof addTransactionMutation,
  undefined,
  [AddTransactionEvent]
>;

export type UpdateTransactionMutation = MutationType<
  "updateTransaction",
  typeof updateTransactionMutation,
  {
    id: string;
    amount: number;
    fromAccount: string;
    toAccount: string;
  },
  [UpdateTransactionEvent]
>;

export type DeleteTransactionMutation = MutationType<
  "deleteTransaction",
  typeof deleteTransactionMutation,
  Transaction,
  [DeleteTransactionEvent]
>;

export const createActivityCategoryMutation = graphql(/* GraphQL */ `
  mutation CreateActivityCategory(
    $id: String!
    $name: String!
    $type: String!
    $emoji: String
  ) {
    createActivityCategory(
      id: $id
      name: $name
      type: $type
      emoji: $emoji
    ) {
      id
    }
  }
`);

export const updateActivityCategoryMutation = graphql(/* GraphQL */ `
  mutation UpdateActivityCategory($id: String!, $name: String!, $emoji: String) {
    updateActivityCategory(id: $id, name: $name, emoji: $emoji) {
      id
    }
  }
`);

export const deleteActivityCategoryMutation = graphql(/* GraphQL */ `
  mutation DeleteActivityCategory($id: String!) {
    deleteActivityCategory(id: $id) {
      success
    }
  }
`);

export const createActivitySubCategoryMutation = graphql(/* GraphQL */ `
  mutation CreateActivitySubCategory(
    $id: String!
    $name: String!
    $category: String!
    $emoji: String
  ) {
    createActivitySubCategory(
      id: $id
      name: $name
      category: $category
      emoji: $emoji
    ) {
      id
    }
  }
`);

export const updateActivitySubCategoryMutation = graphql(/* GraphQL */ `
  mutation UpdateActivitySubCategory($id: String!, $name: String!, $emoji: String) {
    updateActivitySubCategory(id: $id, name: $name, emoji: $emoji) {
      id
    }
  }
`);

export const deleteActivitySubCategoryMutation = graphql(/* GraphQL */ `
  mutation DeleteActivitySubCategory($id: String!) {
    deleteActivitySubCategory(id: $id) {
      success
    }
  }
`);

export type CreateActivityCategoryMutation = MutationType<
  "createActivityCategory",
  typeof createActivityCategoryMutation,
  undefined,
  [CreateActivityCategoryEvent]
>;

export type UpdateActivityCategoryMutation = MutationType<
  "updateActivityCategory",
  typeof updateActivityCategoryMutation,
  {
    id: string;
    name: string;
    emoji?: string | null;
  },
  [UpdateActivityCategoryEvent]
>;

export type DeleteActivityCategoryMutation = MutationType<
  "deleteActivityCategory",
  typeof deleteActivityCategoryMutation,
  {
    category: ActivityCategory;
    activities: string[];
    activitiesSubcategories: Record<string, string>;
  },
  [DeleteActivityCategoryEvent]
>;

export type CreateActivitySubCategoryMutation = MutationType<
  "createActivitySubCategory",
  typeof createActivitySubCategoryMutation,
  undefined,
  [CreateActivitySubCategoryEvent]
>;

export type UpdateActivitySubCategoryMutation = MutationType<
  "updateActivitySubCategory",
  typeof updateActivitySubCategoryMutation,
  {
    id: string;
    name: string;
    emoji?: string | null;
  },
  [UpdateActivitySubCategoryEvent]
>;

export type DeleteActivitySubCategoryMutation = MutationType<
  "deleteActivitySubCategory",
  typeof deleteActivitySubCategoryMutation,
  { subcategory: ActivitySubCategory; activities: string[] },
  [DeleteActivitySubCategoryEvent]
>;

export type ActivityMutation =
  | CreateActivityMutation
  | UpdateActivityMutation
  | DeleteActivityMutation
  | ShareActivityMutation
  | AddTransactionMutation
  | UpdateTransactionMutation
  | DeleteTransactionMutation
  | CreateActivityCategoryMutation
  | UpdateActivityCategoryMutation
  | DeleteActivityCategoryMutation
  | CreateActivitySubCategoryMutation
  | UpdateActivitySubCategoryMutation
  | DeleteActivitySubCategoryMutation;
