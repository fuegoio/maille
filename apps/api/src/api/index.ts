import { createYoga } from "graphql-yoga";
import { builder } from "./builder";
import { useAuth } from "./auth";
import { useGraphQLSSE } from "@graphql-yoga/plugin-graphql-sse";

import { registerActivitiesQueries } from "./activities/queries";
import { registerActivitiesMutations } from "./activities/mutations";
import { registerAccountsQueries } from "./accounts/queries";
import { registerAccountsMutations } from "./accounts/mutations";
import { registerMovementsQueries } from "./movements/queries";
import { registerMovementsMutations } from "./movements/mutations";
import { registerProjectsQueries } from "./projects/queries";
import { registerProjectsMutations } from "./projects/mutations";
import { registerAssetsQueries } from "./assets/queries";
import { registerAssetsMutations } from "./assets/mutations";
import { registerCounterpartiesQueries } from "./counterparties/queries";
import { registerCounterpartiesMutations } from "./counterparties/mutations";
import { registerContactsQueries } from "./contacts/queries";
import { registerContactsMutations } from "./contacts/mutations";

builder.queryType({});
registerActivitiesQueries();
registerAccountsQueries();
registerMovementsQueries();
registerProjectsQueries();
registerAssetsQueries();
registerCounterpartiesQueries();
registerContactsQueries();

builder.mutationType({});
registerActivitiesMutations();
registerMovementsMutations();
registerProjectsMutations();
registerAccountsMutations();
registerAssetsMutations();
registerCounterpartiesMutations();
registerContactsMutations();

export const schema = builder.toSchema();

export const yoga = createYoga({
  schema,
  plugins: [useAuth(), useGraphQLSSE()],
});
