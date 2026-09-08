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
import { registerFundsQueries } from "./funds/queries";
import { registerFundsMutations } from "./funds/mutations";
import { registerAssetsQueries } from "./assets/queries";
import { registerAssetsMutations } from "./assets/mutations";
import { registerCounterpartiesQueries } from "./counterparties/queries";
import { registerCounterpartiesMutations } from "./counterparties/mutations";
import { registerContactsQueries } from "./contacts/queries";
import { registerContactsMutations } from "./contacts/mutations";
import { registerWorkflowsQueries } from "./workflows/queries";
import { registerWorkflowsMutations } from "./workflows/mutations";

builder.queryType({});
registerActivitiesQueries();
registerAccountsQueries();
registerMovementsQueries();
registerProjectsQueries();
registerFundsQueries();
registerAssetsQueries();
registerCounterpartiesQueries();
registerContactsQueries();
registerWorkflowsQueries();

builder.mutationType({});
registerActivitiesMutations();
registerMovementsMutations();
registerProjectsMutations();
registerFundsMutations();
registerAccountsMutations();
registerAssetsMutations();
registerCounterpartiesMutations();
registerContactsMutations();
registerWorkflowsMutations();

export const schema = builder.toSchema();

export const yoga = createYoga({
  schema,
  plugins: [useAuth(), useGraphQLSSE()],
});
