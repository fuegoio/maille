import { builder } from "@/api/builder";
import { db } from "@/database";
import { workspaces, workspaceUsers } from "@/tables";
import { WorkspaceSchema } from "./schemas";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

export const registerWorkspaceMutations = () => {
  builder.mutationField("createWorkspace", (t) =>
    t.field({
      type: WorkspaceSchema,
      args: {
        name: t.arg({ type: "String", required: true }),
        startingDate: t.arg({ type: "Date", required: true }),
        currency: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        const workspaceId = randomUUID();
        const createdAt = new Date();

        const workspaceResults = await db
          .insert(workspaces)
          .values({
            id: workspaceId,
            name: args.name,
            startingDate: args.startingDate,
            currency: args.currency,
            createdAt: createdAt,
          })
          .returning();
        const workspace = workspaceResults[0];

        if (!workspace) {
          throw new GraphQLError("Failed to create workspace");
        }

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
          createdAt: workspace.createdAt
            ? workspace.createdAt.toISOString()
            : createdAt.toISOString(),
        };
      },
    }),
  );

  builder.mutationField("updateWorkspace", (t) =>
    t.field({
      type: WorkspaceSchema,
      args: {
        id: t.arg({ type: "String", required: true }),
        name: t.arg({ type: "String" }),
        startingDate: t.arg({ type: "Date" }),
        currency: t.arg({ type: "String" }),
      },
      resolve: async (root, args) => {
        const result = await db
          .update(workspaces)
          .set({
            name: args.name,
            startingDate: args.startingDate,
            currency: args.currency,
          })
          .where(eq(workspaces.id, args.id))
          .returning();

        const workspace = result[0];
        if (!workspace) {
          throw new GraphQLError("Workspace not found");
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

  builder.mutationField("deleteWorkspace", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args) => {
        const result = await db.delete(workspaces).where(eq(workspaces.id, args.id)).returning();

        return result.length > 0;
      },
    }),
  );
};
