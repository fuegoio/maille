import { graphql } from "@/gql";
import type { MutationType } from "./type";

export const createUserMutation = graphql(/* GraphQL */ `
  mutation CreateUser(
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
  ) {
    createUser(
      firstName: $firstName
      lastName: $lastName
      email: $email
      password: $password
    ) {
      id
    }
  }
`);

export type CreateUserMutation = MutationType<
  "createUser",
  typeof createUserMutation,
  undefined
>;

export const updateUserMutation = graphql(/* GraphQL */ `
  mutation UpdateUser($firstName: String, $lastName: String, $avatar: String) {
    updateUser(firstName: $firstName, lastName: $lastName, avatar: $avatar) {
      id
    }
  }
`);

export type UpdateUserMutation = MutationType<
  "updateUser",
  typeof updateUserMutation,
  {
    firstName: string;
    lastName: string;
    avatar: string | null;
  }
>;

export type UserMutation = CreateUserMutation | UpdateUserMutation;
