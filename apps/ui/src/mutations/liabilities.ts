import { graphql } from "@/gql";
import type { Liability } from "@maille/core/liabilities";
import type { MutationType } from "./type";

export const updateLiabilityMutation = graphql(/* GraphQL */ `
  mutation UpdateLiability(
    $id: UUID!
    $name: String
    $other: String
    $otherUser: UUID
  ) {
    updateLiability(
      id: $id
      name: $name
      other: $other
      otherUser: $otherUser
    ) {
      id
    }
  }
`);

export type LiabilityMutation =
  | MutationType<"updateLiability", typeof updateLiabilityMutation, Liability>
  | unknown;
