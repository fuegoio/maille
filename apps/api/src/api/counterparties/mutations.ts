import { db } from "@/database";
import { builder } from "../builder";
import { CounterpartySchema } from "./schemas";
import { addEvent } from "../events";
import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { validateWorkspace } from "@/services/workspaces";
import { counterparties } from "@/tables";

export const registerCounterpartiesMutations = () => {
  builder.mutationField("createCounterparty", (t) =>
    t.field({
      type: CounterpartySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        account: t.arg.string(),
        name: t.arg.string(),
        description: t.arg.string({ required: false }),
        user: t.arg.string({ required: false }),
        workspace: t.arg({
          type: "String",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        await validateWorkspace(args.workspace, ctx.user.id);

        const counterpartyResults = await db
          .insert(counterparties)
          .values({
            id: args.id,
            account: args.account,
            workspace: args.workspace,
            name: args.name,
            description: args.description,
            user: args.user,
          })
          .returning();
        const counterparty = counterpartyResults[0];

        if (!counterparty) {
          throw new GraphQLError("Failed to create counterparty");
        }

        await addEvent({
          type: "createCounterparty",
          payload: {
            id: args.id,
            account: args.account,
            name: args.name,
            description: args.description ?? null,
            user: args.user ?? null,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: args.workspace,
        });

        return { ...counterparty, liability: 0 };
      },
    }),
  );

  builder.mutationField("updateCounterparty", (t) =>
    t.field({
      type: CounterpartySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string({ required: false }),
        description: t.arg.string({ required: false }),
        user: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const counterparty = (
          await db.select().from(counterparties).where(eq(counterparties.id, args.id))
        )[0];
        if (!counterparty) {
          throw new GraphQLError("Counterparty not found");
        }

        await validateWorkspace(counterparty.workspace, ctx.user.id);

        const updates: Partial<typeof counterparty> = {};
        if (args.name) {
          updates.name = args.name;
        }

        // Optional fields
        if (args.description !== undefined) {
          updates.description = args.description;
        }
        if (args.user !== undefined) {
          updates.user = args.user;
        }

        const updatedCounterparties = await db
          .update(counterparties)
          .set(updates)
          .where(eq(counterparties.id, args.id))
          .returning();
        const updatedCounterparty = updatedCounterparties[0];

        if (!updatedCounterparty) {
          throw new GraphQLError("Failed to update counterparty");
        }

        await addEvent({
          type: "updateCounterparty",
          payload: {
            id: args.id,
            ...updates,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: counterparty.workspace,
        });

        return {
          ...updatedCounterparty,
        };
      },
    }),
  );

  builder.mutationField("deleteCounterparty", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const counterparty = (
          await db.select().from(counterparties).where(eq(counterparties.id, args.id))
        )[0];
        if (!counterparty) {
          throw new GraphQLError("Counterparty not found");
        }

        await validateWorkspace(counterparty.workspace, ctx.user.id);

        await db.delete(counterparties).where(eq(counterparties.id, args.id));

        await addEvent({
          type: "deleteCounterparty",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: counterparty.workspace,
        });

        return true;
      },
    }),
  );
};

