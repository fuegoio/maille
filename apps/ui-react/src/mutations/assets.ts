import type { CreateAssetEvent } from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createAssetMutation = graphql(/* GraphQL */ `
  mutation CreateAsset(
    $id: String!
    $account: String!
    $name: String!
    $description: String
    $location: String
    $workspace: String!
  ) {
    createAsset(
      id: $id
      account: $account
      name: $name
      description: $description
      location: $location
      workspace: $workspace
    ) {
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

export type AssetMutation = CreateAssetMutation;
