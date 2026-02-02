import { createYoga } from "graphql-yoga";
import { builder } from "./builder";
import { useAuth } from "./auth";
import { useGraphQLSSE } from "@graphql-yoga/plugin-graphql-sse";

import { registerActivitiesQueries } from "./activities/queries";
import { registerActivitiesMutations } from "./activities/mutations";
import { registerAccountsQueries } from "./accounts/queries";
import { registerAccountsMutations } from "./accounts/mutations";
import { registerSettingsQueries } from "./settings";
import { registerMovementsQueries } from "./movements/queries";
import { registerMovementsMutations } from "./movements/mutations";
import { registerProjectsQueries } from "./projects/queries";
import { registerProjectsMutations } from "./projects/mutations";
import { registerUsersMutations } from "./users/mutations";
import { registerUsersQueries } from "./users/queries";

builder.queryType({});
registerActivitiesQueries();
registerAccountsQueries();
registerSettingsQueries();
registerMovementsQueries();
registerProjectsQueries();
registerUsersQueries();

builder.mutationType({});
registerActivitiesMutations();
registerMovementsMutations();
registerProjectsMutations();
registerAccountsMutations();
registerUsersMutations();

export const schema = builder.toSchema();

export const yoga = createYoga({
  schema,
  plugins: [useAuth(), useGraphQLSSE()],
});
