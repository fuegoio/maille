import { builder } from "@/api/builder";
import { db } from "@/database";
import { workspaces } from "@/tables";
import { WorkspaceSchema } from "./schemas";
import { eq } from "drizzle-orm";

export const registerWorkspaceQueries = () => {
  builder.queryField("workspaces", (t) =>
    t.field({
      type: [WorkspaceSchema],
      resolve: async () => {
        const workspacesList = await db.select().from(workspaces);
        return workspacesList.map((workspace) => ({
          ...workspace,
          createdAt: workspace.createdAt.toISOString(),
        }));
      },
    }),
  );

  builder.queryField("workspace", (t) =>
    t.field({
      type: WorkspaceSchema,
      args: {
        id: t.arg({ type: "UUID", required: true }),
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

        return {
          ...workspace,
          createdAt: workspace.createdAt.toISOString(),
        };
      },
    }),
  );
};

