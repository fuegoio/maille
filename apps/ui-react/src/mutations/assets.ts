import type { Asset, AssetValuation } from "@maille/core/accounts";
import type {
  CreateAssetEvent,
  UpdateAssetEvent,
  DeleteAssetEvent,
  AddAssetValuationEvent,
  UpdateAssetValuationEvent,
  DeleteAssetValuationEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createAssetMutation = graphql(/* GraphQL */ `
  mutation CreateAsset(
    $id: String!
    $account: String!
    $name: String!
    $description: String
    $location: String
  ) {
    createAsset(
      id: $id
      account: $account
      name: $name
      description: $description
      location: $location
    ) {
      id
    }
  }
`);

export const updateAssetMutation = graphql(/* GraphQL */ `
  mutation UpdateAsset(
    $id: String!
    $name: String
    $description: String
    $location: String
  ) {
    updateAsset(
      id: $id
      name: $name
      description: $description
      location: $location
    ) {
      id
      name
      description
      location
    }
  }
`);

export const deleteAssetMutation = graphql(/* GraphQL */ `
  mutation DeleteAsset($id: String!) {
    deleteAsset(id: $id) {
      id
    }
  }
`);

export type CreateAssetMutation = MutationType<
  "createAsset",
  typeof createAssetMutation,
  undefined,
  [CreateAssetEvent]
>;

export type UpdateAssetMutation = MutationType<
  "updateAsset",
  typeof updateAssetMutation,
  Partial<Asset>,
  [UpdateAssetEvent]
>;

export type DeleteAssetMutation = MutationType<
  "deleteAsset",
  typeof deleteAssetMutation,
  { asset: Asset; valuations: AssetValuation[] },
  [DeleteAssetEvent]
>;

export const addAssetValuationMutation = graphql(/* GraphQL */ `
  mutation AddAssetValuation(
    $id: String!
    $asset: String!
    $date: Date!
    $value: Float!
  ) {
    addAssetValuation(id: $id, asset: $asset, date: $date, value: $value) {
      id
    }
  }
`);

export const updateAssetValuationMutation = graphql(/* GraphQL */ `
  mutation UpdateAssetValuation($id: String!, $date: Date, $value: Float) {
    updateAssetValuation(id: $id, date: $date, value: $value) {
      id
    }
  }
`);

export const deleteAssetValuationMutation = graphql(/* GraphQL */ `
  mutation DeleteAssetValuation($id: String!) {
    deleteAssetValuation(id: $id)
  }
`);

export type AddAssetValuationMutation = MutationType<
  "addAssetValuation",
  typeof addAssetValuationMutation,
  undefined,
  [AddAssetValuationEvent]
>;

export type UpdateAssetValuationMutation = MutationType<
  "updateAssetValuation",
  typeof updateAssetValuationMutation,
  AssetValuation,
  [UpdateAssetValuationEvent]
>;

export type DeleteAssetValuationMutation = MutationType<
  "deleteAssetValuation",
  typeof deleteAssetValuationMutation,
  AssetValuation,
  [DeleteAssetValuationEvent]
>;

export type AssetMutation =
  | CreateAssetMutation
  | UpdateAssetMutation
  | DeleteAssetMutation
  | AddAssetValuationMutation
  | UpdateAssetValuationMutation
  | DeleteAssetValuationMutation;
