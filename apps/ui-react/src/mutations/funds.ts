import type { Fund, FundMove } from "@maille/core/funds";
import type {
  CreateFundEvent,
  CreateFundMoveEvent,
  DeleteFundEvent,
  DeleteFundMoveEvent,
  UpdateFundEvent,
  UpdateFundMoveEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createFundMutation = graphql(/* GraphQL */ `
  mutation CreateFund(
    $id: String!
    $name: String!
    $emoji: String
    $startDate: Date
    $endDate: Date
  ) {
    createFund(
      id: $id
      name: $name
      emoji: $emoji
      startDate: $startDate
      endDate: $endDate
    ) {
      id
    }
  }
`);

export const updateFundMutation = graphql(/* GraphQL */ `
  mutation UpdateFund(
    $id: String!
    $name: String
    $emoji: String
    $startDate: Date
    $endDate: Date
  ) {
    updateFund(
      id: $id
      name: $name
      emoji: $emoji
      startDate: $startDate
      endDate: $endDate
    ) {
      id
    }
  }
`);

export const deleteFundMutation = graphql(/* GraphQL */ `
  mutation DeleteFund($id: String!) {
    deleteFund(id: $id)
  }
`);

export const createFundMoveMutation = graphql(/* GraphQL */ `
  mutation CreateFundMove(
    $id: String!
    $fromFund: String
    $toFund: String
    $amount: Float!
    $date: Date!
    $note: String
  ) {
    createFundMove(
      id: $id
      fromFund: $fromFund
      toFund: $toFund
      amount: $amount
      date: $date
      note: $note
    ) {
      id
    }
  }
`);

export const updateFundMoveMutation = graphql(/* GraphQL */ `
  mutation UpdateFundMove(
    $id: String!
    $fromFund: String
    $toFund: String
    $amount: Float
    $date: Date
    $note: String
  ) {
    updateFundMove(
      id: $id
      fromFund: $fromFund
      toFund: $toFund
      amount: $amount
      date: $date
      note: $note
    ) {
      id
    }
  }
`);

export const deleteFundMoveMutation = graphql(/* GraphQL */ `
  mutation DeleteFundMove($id: String!) {
    deleteFundMove(id: $id)
  }
`);

export type CreateFundMutation = MutationType<
  "createFund",
  typeof createFundMutation,
  undefined,
  [CreateFundEvent]
>;

export type UpdateFundMutation = MutationType<
  "updateFund",
  typeof updateFundMutation,
  Fund,
  [UpdateFundEvent]
>;

export type DeleteFundMutation = MutationType<
  "deleteFund",
  typeof deleteFundMutation,
  Fund,
  [DeleteFundEvent]
>;

export type CreateFundMoveMutation = MutationType<
  "createFundMove",
  typeof createFundMoveMutation,
  undefined,
  [CreateFundMoveEvent]
>;

export type UpdateFundMoveMutation = MutationType<
  "updateFundMove",
  typeof updateFundMoveMutation,
  FundMove,
  [UpdateFundMoveEvent]
>;

export type DeleteFundMoveMutation = MutationType<
  "deleteFundMove",
  typeof deleteFundMoveMutation,
  FundMove,
  [DeleteFundMoveEvent]
>;

export type FundMutation =
  | CreateFundMutation
  | UpdateFundMutation
  | DeleteFundMutation
  | CreateFundMoveMutation
  | UpdateFundMoveMutation
  | DeleteFundMoveMutation;
