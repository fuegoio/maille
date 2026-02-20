import { builder } from "@/api/builder";
import { db } from "@/database";
import { workspaces, workspaceUsers, user } from "@/tables";
import { WorkspaceSchema } from "./schemas";
import { eq, inArray } from "drizzle-orm";
import { validateWorkspace } from "@/services/workspaces";

export const registerWorkspaceQueries = () => {
  builder.queryField("workspaces", (t) =>
    t.field({
      type: [WorkspaceSchema],
      resolve: async (root, args, ctx) => {
        const workspacesList = await db
          .select()
          .from(workspaces)
          .leftJoin(workspaceUsers, eq(workspaceUsers.workspace, workspaces.id))
          .where(eq(workspaceUsers.user, ctx.user.id));

        return workspacesList.map((workspace) => ({
          ...workspace.workspaces,
          users: [],
          createdAt: workspace.workspaces.createdAt.toISOString(),
        }));
      },
    }),
  );

  builder.queryField("workspace", (t) =>
    t.field({
      type: WorkspaceSchema,
      args: {
        id: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        const workspace = await validateWorkspace(args.id, ctx.user.id);

        // Get users for this workspace
        const workspaceUsersList = await db
          .select()
          .from(workspaceUsers)
          .where(eq(workspaceUsers.workspace, args.id));
        const userIds = workspaceUsersList.map((wu) => wu.user);
        const usersList = await db.select().from(user).where(inArray(user.id, userIds));
        const usersData = usersList.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image || null,
        }));

        return {
          ...workspace,
          createdAt: workspace.createdAt.toISOString(),
          users: usersData,
        };
      },
    }),
  );
};
