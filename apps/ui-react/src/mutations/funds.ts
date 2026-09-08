import type { Fund, FundAccount } from "@maille/core/funds";
import type {
  CreateFundEvent,
  DeleteFundEvent,
  UpdateFundAccountsEvent,
  UpdateFundEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createFundMutation = graphql(/* GraphQL */ `
  mutation CreateFund(
    $id: String!
    $name: String!
    $color: String
    $startDate: Date
    $endDate: Date
    $parentFund: String
  ) {
    createFund(
      id: $id
      name: $name
      color: $color
      startDate: $startDate
      endDate: $endDate
      parentFund: $parentFund
    ) {
      id
    }
  }
`);

export const updateFundMutation = graphql(/* GraphQL */ `
  mutation UpdateFund(
    $id: String!
    $name: String
    $color: String
    $startDate: Date
    $endDate: Date
    $parentFund: String
  ) {
    updateFund(
      id: $id
      name: $name
      color: $color
      startDate: $startDate
      endDate: $endDate
      parentFund: $parentFund
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

export const setFundAccountsMutation = graphql(/* GraphQL */ `
  mutation SetFundAccounts($fund: String!, $accounts: [FundAccountInput!]!) {
    setFundAccounts(fund: $fund, accounts: $accounts) {
      id
    }
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

export type SetFundAccountsMutation = MutationType<
  "setFundAccounts",
  typeof setFundAccountsMutation,
  FundAccount[],
  [UpdateFundAccountsEvent]
>;

export type FundMutation =
  | CreateFundMutation
  | UpdateFundMutation
  | DeleteFundMutation
  | SetFundAccountsMutation;
