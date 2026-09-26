import type { Investment, InvestmentPrice } from "@maille/core/accounts";
import type {
  AddInvestmentPriceEvent,
  CreateInvestmentEvent,
  DeleteInvestmentEvent,
  DeleteInvestmentPriceEvent,
  UpdateInvestmentEvent,
  UpdateInvestmentPriceEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createInvestmentMutation = graphql(/* GraphQL */ `
  mutation CreateInvestment(
    $id: String!
    $account: String!
    $name: String!
    $symbol: String
    $description: String
    $initialQuantity: Float
  ) {
    createInvestment(
      id: $id
      account: $account
      name: $name
      symbol: $symbol
      description: $description
      initialQuantity: $initialQuantity
    ) {
      id
    }
  }
`);

export const updateInvestmentMutation = graphql(/* GraphQL */ `
  mutation UpdateInvestment(
    $id: String!
    $name: String
    $symbol: String
    $description: String
    $initialQuantity: Float
  ) {
    updateInvestment(
      id: $id
      name: $name
      symbol: $symbol
      description: $description
      initialQuantity: $initialQuantity
    ) {
      id
    }
  }
`);

export const deleteInvestmentMutation = graphql(/* GraphQL */ `
  mutation DeleteInvestment($id: String!) {
    deleteInvestment(id: $id)
  }
`);

export const addInvestmentPriceMutation = graphql(/* GraphQL */ `
  mutation AddInvestmentPrice(
    $id: String!
    $investment: String!
    $date: Date!
    $price: Float!
  ) {
    addInvestmentPrice(
      id: $id
      investment: $investment
      date: $date
      price: $price
    ) {
      id
    }
  }
`);

export const updateInvestmentPriceMutation = graphql(/* GraphQL */ `
  mutation UpdateInvestmentPrice($id: String!, $date: Date, $price: Float) {
    updateInvestmentPrice(id: $id, date: $date, price: $price) {
      id
    }
  }
`);

export const deleteInvestmentPriceMutation = graphql(/* GraphQL */ `
  mutation DeleteInvestmentPrice($id: String!) {
    deleteInvestmentPrice(id: $id)
  }
`);

export type CreateInvestmentMutation = MutationType<
  "createInvestment",
  typeof createInvestmentMutation,
  undefined,
  [CreateInvestmentEvent]
>;

export type UpdateInvestmentMutation = MutationType<
  "updateInvestment",
  typeof updateInvestmentMutation,
  Partial<Investment>,
  [UpdateInvestmentEvent]
>;

export type DeleteInvestmentMutation = MutationType<
  "deleteInvestment",
  typeof deleteInvestmentMutation,
  { investment: Investment; prices: InvestmentPrice[] },
  [DeleteInvestmentEvent]
>;

export type AddInvestmentPriceMutation = MutationType<
  "addInvestmentPrice",
  typeof addInvestmentPriceMutation,
  undefined,
  [AddInvestmentPriceEvent]
>;

export type UpdateInvestmentPriceMutation = MutationType<
  "updateInvestmentPrice",
  typeof updateInvestmentPriceMutation,
  InvestmentPrice,
  [UpdateInvestmentPriceEvent]
>;

export type DeleteInvestmentPriceMutation = MutationType<
  "deleteInvestmentPrice",
  typeof deleteInvestmentPriceMutation,
  InvestmentPrice,
  [DeleteInvestmentPriceEvent]
>;

export type InvestmentMutation =
  | CreateInvestmentMutation
  | UpdateInvestmentMutation
  | DeleteInvestmentMutation
  | AddInvestmentPriceMutation
  | UpdateInvestmentPriceMutation
  | DeleteInvestmentPriceMutation;
