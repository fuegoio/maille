import type { DeleteContactEvent } from "@maille/core/sync";

import { graphql } from "@/gql";
import type { Contact } from "@/gql/graphql";

import type { MutationType } from "./type";

export const deleteContactMutation = graphql(/* GraphQL */ `
  mutation DeleteContact(
    $id: String!
  ) {
    deleteContact(
      id: $id
    )
  }
`);

export type DeleteContactMutation = MutationType<
  "deleteContact",
  typeof deleteContactMutation,
  Contact,
  [DeleteContactEvent]
>;

export type ContactMutation = DeleteContactMutation;
