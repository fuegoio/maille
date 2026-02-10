import { builder } from "@/api/builder";
import { db } from "@/database";
import { workspaces, workspaceUsers, user } from "@/tables";
import { WorkspaceSchema } from "./schemas";
import { eq, inArray } from "drizzle-orm";

export const registerWorkspaceQueries = () => {
  builder.queryField("workspaces", (t) =>
    t.field({
      type: [WorkspaceSchema],
      resolve: async () => {
        const workspacesList = await db.select().from(workspaces);
        return workspacesList.map((workspace) => ({
          ...workspace,
          users: [],
          createdAt: workspace.createdAt.toISOString(),
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
      resolve: async (root, args) => {
        const workspace = await db
          .select()
          .from(workspaces)
          .where(eq(workspaces.id, args.id))
          .limit(1)
          .then((res) => res[0]);

        if (!workspace) {
          throw new Error("Workspace not found");
        }

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
