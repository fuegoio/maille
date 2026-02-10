import { db } from "@/database";
import { workspaces, workspaceUsers } from "@/tables";
import { eq, and } from "drizzle-orm";
import { GraphQLError } from "graphql";

export const validateWorkspace = async (workspaceId: string, userId: string) => {
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then((res) => res[0]);

  if (!workspace) {
    throw new GraphQLError("Workspace not found");
  }

  // Check if user has access to the workspace
  const workspaceUser = await db
    .select()
    .from(workspaceUsers)
    .where(and(eq(workspaceUsers.workspace, workspaceId), eq(workspaceUsers.user, userId)))
    .limit(1)
    .then((res) => res[0]);

  if (!workspaceUser) {
    throw new GraphQLError("User does not have access to this workspace");
  }

  return workspace;
};
