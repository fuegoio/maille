import { db } from "@/database";
import { workspaces, workspaceUsers } from "@/tables";
import type { UUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { GraphQLError } from "graphql";

export const validateWorkspace = async (workspaceId: UUID, userId: UUID) => {
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
    .where(
      and(
        eq(workspaceUsers.workspace, workspaceId),
        eq(workspaceUsers.user, userId)
      )
    )
    .limit(1)
    .then((res) => res[0]);

  if (!workspaceUser) {
    throw new GraphQLError("User does not have access to this workspace");
  }

  return workspace;
};

export const getWorkspace = async (workspaceId: UUID) => {
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then((res) => res[0]);

  if (!workspace) {
    throw new GraphQLError("Workspace not found");
  }

  return workspace;
};

export const addUserToWorkspace = async (workspaceId: UUID, userId: UUID) => {
  await db.insert(workspaceUsers).values({
    id: crypto.randomUUID(),
    user: userId,
    workspace: workspaceId,
    createdAt: new Date(),
  });
};

export const removeUserFromWorkspace = async (workspaceId: UUID, userId: UUID) => {
  await db
    .delete(workspaceUsers)
    .where(
      and(
        eq(workspaceUsers.workspace, workspaceId),
        eq(workspaceUsers.user, userId)
      )
    );
};