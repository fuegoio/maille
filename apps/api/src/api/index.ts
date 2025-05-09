import { createYoga } from "graphql-yoga";
import { builder } from "./builder";
import { useAuth } from "./auth";
import { useGraphQLSSE } from "@graphql-yoga/plugin-graphql-sse";

import { registerActivitiesQueries } from "./activities/queries";
import { registerActivitiesMutations } from "./activities/mutations";
import { registerAccountsQueries } from "./accounts/queries";
import { registerSettingsQueries } from "./settings";
import { registerMovementsQueries } from "./movements/queries";
import { registerMovementsMutations } from "./movements/mutations";
import { registerLiabilitiesQueries } from "./liabilities/queries";
import { registerProjectsQueries } from "./projects/queries";
import { registerProjectsMutations } from "./projects/mutations";

builder.queryType({});
registerActivitiesQueries();
registerAccountsQueries();
registerSettingsQueries();
registerMovementsQueries();
registerLiabilitiesQueries();
registerProjectsQueries();

builder.mutationType({});
registerActivitiesMutations();
registerMovementsMutations();
registerProjectsMutations();

export const schema = builder.toSchema();

export const yoga = createYoga({
  schema,
  plugins: [useAuth(), useGraphQLSSE()],
});
