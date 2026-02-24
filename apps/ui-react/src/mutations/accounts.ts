import type { Account } from "@maille/core/accounts";
import type {
  CreateAccountEvent,
  DeleteAccountEvent,
  UpdateAccountEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createAccountMutation = graphql(/* GraphQL */ `
  mutation CreateAccount(
    $id: String!
    $name: String!
    $type: String!
    $startingBalance: Float
    $startingCashBalance: Float
    $movements: Boolean
  ) {
    createAccount(id: $id, name: $name, type: $type,
      startingBalance: $startingBalance,
      startingCashBalance: $startingCashBalance,
      movements: $movements
    ) {
      id
    }
  }
`);

export type CreateAccountMutation = MutationType<
  "createAccount",
  typeof createAccountMutation,
  undefined,
  [CreateAccountEvent]
>;

export const updateAccountMutation = graphql(/* GraphQL */ `
  mutation UpdateAccount(
    $id: String!
    $name: String
    $startingBalance: Float
    $startingCashBalance: Float
    $movements: Boolean
  ) {
    updateAccount(
      id: $id
      name: $name
      startingBalance: $startingBalance
      startingCashBalance: $startingCashBalance
      movements: $movements
    ) {
      id
    }
  }
`);

export type UpdateAccountMutation = MutationType<
  "updateAccount",
  typeof updateAccountMutation,
  {
    id: string;
    startingBalance: number | null;
    startingCashBalance: number | null;
    movements: boolean;
  },
  [UpdateAccountEvent]
>;

export const deleteAccountMutation = graphql(/* GraphQL */ `
  mutation DeleteAccount($id: String!) {
    deleteAccount(id: $id) {
      success
    }
  }
`);

export type DeleteAccountMutation = MutationType<
  "deleteAccount",
  typeof deleteAccountMutation,
  Account,
  [DeleteAccountEvent]
>;

export type AccountMutation =
  | CreateAccountMutation
  | UpdateAccountMutation
  | DeleteAccountMutation;
