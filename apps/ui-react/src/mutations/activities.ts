import { graphql } from "@/gql";
import type {
  Activity,
  ActivityCategory,
  ActivitySubCategory,
  Transaction,
} from "@maille/core/activities";
import type { UUID } from "crypto";
import type { MutationType } from "./type";
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
  UpdateActivitySubCategoryEvent,
} from "@maille/core/sync";

export const createActivityMutation = graphql(/* GraphQL */ `
  mutation CreateActivity(
    $workspace: UUID!
    $category: UUID
    $date: Date!
    $description: String
    $id: UUID!
    $movement: ActivityMovementInput
    $name: String!
    $project: UUID
    $subcategory: UUID
    $transactions: [TransactionInput!]
    $type: String!
  ) {
    createActivity(
      workspace: $workspace
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
      user
      number
    }
  }
`);

export const updateActivityMutation = graphql(/* GraphQL */ `
  mutation UpdateActivity(
    $id: UUID!
    $category: UUID
    $date: Date
    $description: String
    $name: String
    $project: UUID
    $subcategory: UUID
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
  mutation DeleteActivity($id: UUID!) {
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
    category: UUID | null;
    subcategory: UUID | null;
    project: UUID | null;
  },
  [UpdateActivityEvent]
>;

export type DeleteActivityMutation = MutationType<
  "deleteActivity",
  typeof deleteActivityMutation,
  Activity,
  [DeleteActivityEvent]
>;

export const addTransactionMutation = graphql(/* GraphQL */ `
  mutation AddTransaction(
    $activityId: UUID!
    $id: UUID!
    $amount: Float!
    $fromAccount: UUID!
    $toAccount: UUID!
  ) {
    addTransaction(
      activityId: $activityId
      id: $id
      amount: $amount
      fromAccount: $fromAccount
      toAccount: $toAccount
    ) {
      id
    }
  }
`);

export const updateTransactionMutation = graphql(/* GraphQL */ `
  mutation UpdateTransaction(
    $activityId: UUID!
    $id: UUID!
    $amount: Float
    $fromAccount: UUID
    $toAccount: UUID
  ) {
    updateTransaction(
      activityId: $activityId
      id: $id
      amount: $amount
      fromAccount: $fromAccount
      toAccount: $toAccount
    ) {
      id
    }
  }
`);

export const deleteTransactionMutation = graphql(/* GraphQL */ `
  mutation DeleteTransaction($activityId: UUID!, $id: UUID!) {
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
    id: UUID;
    amount: number;
    fromAccount: UUID;
    toAccount: UUID;
  },
  [UpdateActivityEvent]
>;

export type DeleteTransactionMutation = MutationType<
  "deleteTransaction",
  typeof deleteTransactionMutation,
  Transaction,
  [DeleteTransactionEvent]
>;

export const createActivityCategoryMutation = graphql(/* GraphQL */ `
  mutation CreateActivityCategory(
    $id: UUID!
    $name: String!
    $type: String!
    $workspace: UUID!
  ) {
    createActivityCategory(
      id: $id
      name: $name
      type: $type
      workspace: $workspace
    ) {
      id
    }
  }
`);

export const updateActivityCategoryMutation = graphql(/* GraphQL */ `
  mutation UpdateActivityCategory($id: UUID!, $name: String!) {
    updateActivityCategory(id: $id, name: $name) {
      id
    }
  }
`);

export const deleteActivityCategoryMutation = graphql(/* GraphQL */ `
  mutation DeleteActivityCategory($id: UUID!) {
    deleteActivityCategory(id: $id) {
      success
    }
  }
`);

export const createActivitySubCategoryMutation = graphql(/* GraphQL */ `
  mutation CreateActivitySubCategory(
    $id: UUID!
    $name: String!
    $category: UUID!
    $workspace: UUID!
  ) {
    createActivitySubCategory(
      id: $id
      name: $name
      category: $category
      workspace: $workspace
    ) {
      id
    }
  }
`);

export const updateActivitySubCategoryMutation = graphql(/* GraphQL */ `
  mutation UpdateActivitySubCategory($id: UUID!, $name: String!) {
    updateActivitySubCategory(id: $id, name: $name) {
      id
    }
  }
`);

export const deleteActivitySubCategoryMutation = graphql(/* GraphQL */ `
  mutation DeleteActivitySubCategory($id: UUID!) {
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
    id: UUID;
    name: string;
  },
  [UpdateActivityCategoryEvent]
>;

export type DeleteActivityCategoryMutation = MutationType<
  "deleteActivityCategory",
  typeof deleteActivityCategoryMutation,
  {
    category: ActivityCategory;
    activities: UUID[];
    activitiesSubcategories: Record<UUID, UUID>;
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
    id: UUID;
    name: string;
  },
  [UpdateActivitySubCategoryEvent]
>;

export type DeleteActivitySubCategoryMutation = MutationType<
  "deleteActivitySubCategory",
  typeof deleteActivitySubCategoryMutation,
  { subcategory: ActivitySubCategory; activities: UUID[] },
  [DeleteActivitySubCategoryEvent]
>;

export type ActivityMutation =
  | CreateActivityMutation
  | UpdateActivityMutation
  | DeleteActivityMutation
  | AddTransactionMutation
  | UpdateTransactionMutation
  | DeleteTransactionMutation
  | CreateActivityCategoryMutation
  | UpdateActivityCategoryMutation
  | DeleteActivityCategoryMutation
  | CreateActivitySubCategoryMutation
  | UpdateActivitySubCategoryMutation
  | DeleteActivitySubCategoryMutation;
