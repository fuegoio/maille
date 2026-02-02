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
import { registerWorkspaceQueries } from "./workspaces/queries";
import { registerWorkspaceMutations } from "./workspaces/mutations";

builder.queryType({});
registerActivitiesQueries();
registerAccountsQueries();
registerMovementsQueries();
registerProjectsQueries();
registerWorkspaceQueries();

builder.mutationType({});
registerActivitiesMutations();
registerMovementsMutations();
registerProjectsMutations();
registerAccountsMutations();
registerWorkspaceMutations();

export const schema = builder.toSchema();

export const yoga = createYoga({
  schema,
  plugins: [useAuth(), useGraphQLSSE()],
});
