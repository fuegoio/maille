import { graphql } from "@/gql";
import type { Liability } from "@maille/core/liabilities";
import type { MutationType } from "./type";

export const updateLiabilityMutation = graphql(/* GraphQL */ `
  mutation UpdateLiability(
    $id: UUID!
    $name: String
    $other: String
    $other_user: UUID
  ) {
    updateLiability(
      id: $id
      name: $name
      other: $other
      other_user: $other_user
    ) {
      id
    }
  }
`);

export type LiabilityMutation = MutationType<
  "updateLiability",
  typeof updateLiabilityMutation,
  Liability
>;

