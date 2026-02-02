import { builder } from "@/api/builder";
import { db } from "@/database";
import { workspaces, workspaceUsers } from "@/tables";
import { WorkspaceSchema } from "./schemas";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

export const registerWorkspaceMutations = () => {
  builder.mutationField("createWorkspace", (t) =>
    t.field({
      type: WorkspaceSchema,
      args: {
        id: t.arg({ type: "UUID", required: false }),
        name: t.arg({ type: "String", required: true }),
        startingDate: t.arg({ type: "String", required: false }),
        currency: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        const workspaceId = args.id || randomUUID();
        const createdAt = new Date();

        const [workspace] = await db
          .insert(workspaces)
          .values({
            id: workspaceId,
            name: args.name,
            startingDate: args.startingDate,
            currency: args.currency,
            createdAt: createdAt,
          })
          .returning();

        // Add the creating user to the workspace
        await db.insert(workspaceUsers).values({
          id: randomUUID(),
          user: ctx.user.id,
          workspace: workspaceId,
          createdAt: createdAt,
        });

        return {
          ...workspace,
          users: [{ ...ctx.user, image: ctx.user.image || null }],
          createdAt: workspace.createdAt.toISOString(),
        };
      },
    }),
  );

  builder.mutationField("deleteWorkspace", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "UUID", required: true }),
      },
      resolve: async (root, args) => {
        const result = await db
          .delete(workspaces)
          .where(eq(workspaces.id, args.id))
          .returning();

        return result.length > 0;
      },
    }),
  );
};
