import type { Asset } from "@maille/core/accounts";
import type {
  CreateAssetEvent,
  UpdateAssetEvent,
  DeleteAssetEvent,
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
  Asset,
  [DeleteAssetEvent]
>;

export type AssetMutation =
  | CreateAssetMutation
  | UpdateAssetMutation
  | DeleteAssetMutation;
