import { graphql } from "@/gql";
import type { MutationType } from "./type";
import type { UUID } from "crypto";
import type { Account } from "@maille/core/accounts";

export const createAccountMutation = graphql(/* GraphQL */ `
  mutation CreateAccount(
    $id: UUID!
    $name: String!
    $type: String!
    $workspace: UUID!
  ) {
    createAccount(id: $id, name: $name, type: $type, workspace: $workspace) {
      id
    }
  }
`);

export type CreateAccountMutation = MutationType<
  "createAccount",
  typeof createAccountMutation,
  undefined
>;

export const updateAccountMutation = graphql(/* GraphQL */ `
  mutation UpdateAccount(
    $id: UUID!
    $startingBalance: Float
    $startingCashBalance: Float
    $movements: Boolean
  ) {
    updateAccount(
      id: $id
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
    id: UUID;
    startingBalance: number | null;
    startingCashBalance: number | null;
    movements: boolean;
  }
>;

export const deleteAccountMutation = graphql(/* GraphQL */ `
  mutation DeleteAccount($id: UUID!) {
    deleteAccount(id: $id) {
      success
    }
  }
`);

export type DeleteAccountMutation = MutationType<
  "deleteAccount",
  typeof deleteAccountMutation,
  Account
>;

export type AccountMutation =
  | CreateAccountMutation
  | UpdateAccountMutation
  | DeleteAccountMutation;
