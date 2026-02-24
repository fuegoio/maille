import { db } from "@/database";
import { builder } from "../builder";
import { CounterpartySchema } from "./schemas";
import { addEvent } from "../events";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { accounts, counterparties, transactions } from "@/tables";

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
        contact: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const account = (
          await db
            .select()
            .from(accounts)
            .where(and(eq(accounts.id, args.account), eq(accounts.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        const counterpartyResults = await db
          .insert(counterparties)
          .values({
            id: args.id,
            user: ctx.user.id,
            account: account.id,
            name: args.name,
            description: args.description,
            contact: args.contact,
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
            contact: args.contact ?? null,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
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
        contact: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const counterparty = (
          await db
            .select()
            .from(counterparties)
            .where(and(eq(counterparties.id, args.id), eq(counterparties.user, ctx.user.id)))
        )[0];
        if (!counterparty) {
          throw new GraphQLError("Counterparty not found");
        }

        const updates: Partial<typeof counterparty> = {};
        if (args.name) {
          updates.name = args.name;
        }

        // Optional fields
        if (args.description !== undefined) {
          updates.description = args.description;
        }
        if (args.contact !== undefined) {
          updates.contact = args.contact;
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
          await db
            .select()
            .from(counterparties)
            .where(and(eq(counterparties.id, args.id), eq(counterparties.user, ctx.user.id)))
        )[0];
        if (!counterparty) {
          throw new GraphQLError("Counterparty not found");
        }

        await db.delete(counterparties).where(eq(counterparties.id, args.id));
        await db
          .update(transactions)
          .set({ fromCounterparty: null })
          .where(eq(transactions.fromCounterparty, args.id));
        await db
          .update(transactions)
          .set({ toCounterparty: null })
          .where(eq(transactions.toCounterparty, args.id));

        await addEvent({
          type: "deleteCounterparty",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return true;
      },
    }),
  );
};
