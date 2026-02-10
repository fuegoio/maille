import { graphql } from "@/gql";
import type { Movement, MovementActivity } from "@maille/core/movements";
import type { MutationType } from "./type";

export const createMovementMutation = graphql(/* GraphQL */ `
  mutation CreateMovement(
    $workspace: String!
    $id: String!
    $date: Date!
    $name: String!
    $account: String!
    $amount: Float!
  ) {
    createMovement(
      workspace: $workspace
      id: $id
      date: $date
      name: $name
      account: $account
      amount: $amount
    ) {
      id
    }
  }
`);

export const updateMovementMutation = graphql(/* GraphQL */ `
  mutation UpdateMovement($id: String!, $date: Date, $amount: Float) {
    updateMovement(id: $id, date: $date, amount: $amount) {
      id
    }
  }
`);

export const deleteMovementMutation = graphql(/* GraphQL */ `
  mutation DeleteMovement($id: String!) {
      deleteMovement(id: $id) {
      success
    }
  }
`);

export type CreateMovementMutation = MutationType<
  "createMovement",
  typeof createMovementMutation,
  undefined
>;

export type UpdateMovementMutation = MutationType<
  "updateMovement",
  typeof updateMovementMutation,
  {
    id: string;
    date: string;
    amount: number;
  }
>;

export type DeleteMovementMutation = MutationType<
  "deleteMovement",
  typeof deleteMovementMutation,
  Movement
>;

export const createMovementActivityMutation = graphql(/* GraphQL */ `
  mutation CreateMovementActivity(
    $workspace: String!
    $id: String!
    $movementId: String!
    $activityId: String!
    $amount: Float!
  ) {
    createMovementActivity(
      workspace: $workspace
      id: $id
      movementId: $movementId
      activityId: $activityId
      amount: $amount
    ) {
      id
    }
  }
`);

export const updateMovementActivityMutation = graphql(/* GraphQL */ `
  mutation UpdateMovementActivity($id: String!, $amount: Float!) {
    updateMovementActivity(id: $id, amount: $amount) {
      id
    }
  }
`);

export const deleteMovementActivityMutation = graphql(/* GraphQL */ `
  mutation DeleteMovementActivity($id: String!) {
    deleteMovementActivity(id: $id) {
      success
    }
  }
`);

export type CreateMovementActivityMutation = MutationType<
  "createMovementActivity",
  typeof createMovementActivityMutation,
  undefined
>;

export type UpdateMovementActivityMutation = MutationType<
  "updateMovementActivity",
  typeof updateMovementActivityMutation,
  {
    id: string;
    movement: string;
    amount: number;
  }
>;

export type DeleteMovementActivityMutation = MutationType<
  "deleteMovementActivity",
  typeof deleteMovementActivityMutation,
  MovementActivity & { movement: string }
>;

export type MovementMutation =
  | CreateMovementMutation
  | UpdateMovementMutation
  | DeleteMovementMutation
  | CreateMovementActivityMutation
  | UpdateMovementActivityMutation
  | DeleteMovementActivityMutation;
