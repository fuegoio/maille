import { graphql } from "@/gql";
import type { Movement, MovementActivity } from "@maille/core/movements";
import type { MutationType } from "./type";
import type { UUID } from "crypto";

export const createMovementMutation = graphql(/* GraphQL */ `
  mutation CreateMovement(
    $id: UUID!
    $date: Date!
    $name: String!
    $account: UUID!
    $amount: Float!
  ) {
    createMovement(
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
  mutation UpdateMovement($id: UUID!, $date: Date, $amount: Float) {
    updateMovement(id: $id, date: $date, amount: $amount) {
      id
    }
  }
`);

export const deleteMovementMutation = graphql(/* GraphQL */ `
  mutation DeleteMovement($id: UUID!) {
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
  mutation CreateMovementActivity($id: UUID!, $movementId: UUID!, $activityId: UUID!, $amount: Float!) {
    createMovementActivity(id: $id, movementId: $movementId, activityId: $activityId, amount: $amount) {
      id
    }
  }
`);

export const updateMovementActivityMutation = graphql(/* GraphQL */ `
  mutation UpdateMovementActivity($id: UUID!, $amount: Float!) {
    updateMovementActivity(id: $id, amount: $amount) {
      id
    }
  }
`);

export const deleteMovementActivityMutation = graphql(/* GraphQL */ `
  mutation DeleteMovementActivity($id: UUID!) {
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
    movement: UUID;
    amount: number;
  }
>;

export type DeleteMovementActivityMutation = MutationType<
  "deleteMovementActivity",
  typeof deleteMovementActivityMutation,
  MovementActivity & {movement: UUID}
>;


export type MovementMutation =
  | CreateMovementMutation
  | UpdateMovementMutation
  | DeleteMovementMutation
  | CreateMovementActivityMutation
  | UpdateMovementActivityMutation
  | DeleteMovementActivityMutation;
