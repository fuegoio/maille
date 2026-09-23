import type { AssetDepreciation } from "@maille/core/accounts";
import type {
  CreateAssetDepreciationEvent,
  DeleteAssetDepreciationEvent,
  UpdateAssetDepreciationEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createAssetDepreciationMutation = graphql(/* GraphQL */ `
  mutation CreateAssetDepreciation(
    $id: String!
    $asset: String!
    $method: String!
    $basis: Float!
    $months: Int!
    $startMonth: Date!
    $expenseAccount: String!
    $category: String
    $subcategory: String
  ) {
    createAssetDepreciation(
      id: $id
      asset: $asset
      method: $method
      basis: $basis
      months: $months
      startMonth: $startMonth
      expenseAccount: $expenseAccount
      category: $category
      subcategory: $subcategory
    ) {
      id
    }
  }
`);

export const updateAssetDepreciationMutation = graphql(/* GraphQL */ `
  mutation UpdateAssetDepreciation(
    $id: String!
    $basis: Float
    $months: Int
    $startMonth: Date
    $expenseAccount: String
    $category: String
    $subcategory: String
  ) {
    updateAssetDepreciation(
      id: $id
      basis: $basis
      months: $months
      startMonth: $startMonth
      expenseAccount: $expenseAccount
      category: $category
      subcategory: $subcategory
    ) {
      id
    }
  }
`);

export const deleteAssetDepreciationMutation = graphql(/* GraphQL */ `
  mutation DeleteAssetDepreciation($id: String!) {
    deleteAssetDepreciation(id: $id) {
      id
    }
  }
`);

export type CreateAssetDepreciationMutation = MutationType<
  "createAssetDepreciation",
  typeof createAssetDepreciationMutation,
  undefined,
  [CreateAssetDepreciationEvent]
>;

export type UpdateAssetDepreciationMutation = MutationType<
  "updateAssetDepreciation",
  typeof updateAssetDepreciationMutation,
  Partial<AssetDepreciation>,
  [UpdateAssetDepreciationEvent]
>;

export type DeleteAssetDepreciationMutation = MutationType<
  "deleteAssetDepreciation",
  typeof deleteAssetDepreciationMutation,
  AssetDepreciation,
  [DeleteAssetDepreciationEvent]
>;

export type AssetDepreciationMutation =
  | CreateAssetDepreciationMutation
  | UpdateAssetDepreciationMutation
  | DeleteAssetDepreciationMutation;
