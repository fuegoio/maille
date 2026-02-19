import type { CreateCounterpartyEvent, UpdateCounterpartyEvent, DeleteCounterpartyEvent } from "@maille/core/sync";
import type { Counterparty } from "@/gql/graphql";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createCounterpartyMutation = graphql(/* GraphQL */ `
  mutation CreateCounterparty(
    $id: String!
    $account: String!
    $name: String!
    $description: String
    $user: String
    $workspace: String!
  ) {
    createCounterparty(
      id: $id
      account: $account
      name: $name
      description: $description
      user: $user
      workspace: $workspace
    ) {
      id
    }
  }
`);

export type CreateCounterpartyMutation = MutationType<
  "createCounterparty",
  typeof createCounterpartyMutation,
  undefined,
  [CreateCounterpartyEvent]
>;

export const updateCounterpartyMutation = graphql(/* GraphQL */ `
  mutation UpdateCounterparty(
    $id: String!
    $name: String
    $description: String
    $user: String
    $workspace: String!
  ) {
    updateCounterparty(
      id: $id
      name: $name
      description: $description
      user: $user
      workspace: $workspace
    ) {
      id
    }
  }
`);

export type UpdateCounterpartyMutation = MutationType<
  "updateCounterparty",
  typeof updateCounterpartyMutation,
  CreateCounterpartyEvent,
  [UpdateCounterpartyEvent]
>;

export const deleteCounterpartyMutation = graphql(/* GraphQL */ `
  mutation DeleteCounterparty(
    $id: String!
    $workspace: String!
  ) {
    deleteCounterparty(
      id: $id
      workspace: $workspace
    )
  }
`);

export type DeleteCounterpartyMutation = MutationType<
  "deleteCounterparty",
  typeof deleteCounterpartyMutation,
  Counterparty,
  [DeleteCounterpartyEvent]
>;

export type CounterpartyMutation = 
  | CreateCounterpartyMutation
  | UpdateCounterpartyMutation
  | DeleteCounterpartyMutation;
