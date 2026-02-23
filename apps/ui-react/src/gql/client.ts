import { GraphQLClient } from "graphql-request";

import { baseApiURL } from "@/lib/api";

export const graphqlClient = new GraphQLClient(`${baseApiURL}/graphql`, {
  credentials: "include",
});
