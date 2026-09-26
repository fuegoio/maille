import { db } from "@/database";
import { builder } from "../builder";
import { InvestmentPriceSchema, InvestmentSchema } from "./schemas";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "../events";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { accounts, investmentPrices, investments } from "@/tables";

/** The investment, scoped to the user, resolved from its possibly-prefixed id. */
const getUserInvestment = async (investmentId: string, userId: string) => {
  const investment = (
    await db
      .select()
      .from(investments)
      .where(and(like(investments.id, idPattern(investmentId)), eq(investments.user, userId)))
  )[0];
  if (!investment) {
    throw new GraphQLError("Investment not found");
  }
  return investment;
};

export const registerInvestmentsMutations = () => {
  builder.mutationField("createInvestment", (t) =>
    t.field({
      type: InvestmentSchema,
      args: {
        id: t.arg({ type: "String" }),
        account: t.arg.string(),
        name: t.arg.string(),
        symbol: t.arg.string({ required: false }),
        description: t.arg.string({ required: false }),
        quantity: t.arg.float({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const account = (
          await db
            .select()
            .from(accounts)
            .where(and(like(accounts.id, idPattern(args.account)), eq(accounts.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        const investment = (
          await db
            .insert(investments)
            .values({
              id: args.id,
              user: ctx.user.id,
              account: account.id,
              name: args.name,
              symbol: args.symbol || undefined,
              description: args.description || undefined,
              quantity: args.quantity ?? 0,
            })
            .returning()
        )[0];
        if (!investment) {
          throw new GraphQLError("Failed to create investment");
        }

        await addEvent({
          type: "createInvestment",
          payload: {
            id: investment.id,
            account: investment.account,
            name: investment.name,
            symbol: investment.symbol,
            description: investment.description,
            quantity: investment.quantity,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return investment;
      },
    }),
  );

  builder.mutationField("updateInvestment", (t) =>
    t.field({
      type: InvestmentSchema,
      args: {
        id: t.arg({ type: "String" }),
        account: t.arg.string({ required: false }),
        name: t.arg.string({ required: false }),
        symbol: t.arg.string({ required: false }),
        description: t.arg.string({ required: false }),
        quantity: t.arg.float({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const investment = await getUserInvestment(args.id, ctx.user.id);

        const updates: Partial<typeof investment> = {};
        if (args.account) {
          const account = (
            await db
              .select()
              .from(accounts)
              .where(
                and(like(accounts.id, idPattern(args.account)), eq(accounts.user, ctx.user.id)),
              )
              .limit(1)
          )[0];
          if (!account) {
            throw new GraphQLError("Account not found");
          }
          updates.account = account.id;
        }
        if (args.name) {
          updates.name = args.name;
        }
        // Optional fields
        if (args.symbol !== undefined) {
          updates.symbol = args.symbol;
        }
        if (args.description !== undefined) {
          updates.description = args.description;
        }
        if (args.quantity != null) {
          updates.quantity = args.quantity;
        }

        const updatedInvestment = (
          await db
            .update(investments)
            .set(updates)
            .where(eq(investments.id, investment.id))
            .returning()
        )[0];
        if (!updatedInvestment) {
          throw new GraphQLError("Failed to update investment");
        }

        await addEvent({
          type: "updateInvestment",
          payload: {
            id: investment.id,
            ...updates,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedInvestment;
      },
    }),
  );

  builder.mutationField("deleteInvestment", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const investment = await getUserInvestment(args.id, ctx.user.id);

        // Its price points go with it — the cascade owns them.
        await db.delete(investments).where(eq(investments.id, investment.id));

        await addEvent({
          type: "deleteInvestment",
          payload: {
            id: investment.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return true;
      },
    }),
  );

  builder.mutationField("addInvestmentPrice", (t) =>
    t.field({
      type: InvestmentPriceSchema,
      args: {
        id: t.arg({ type: "String" }),
        investment: t.arg({ type: "String" }),
        date: t.arg({ type: "Date" }),
        price: t.arg.float(),
      },
      resolve: async (root, args, ctx) => {
        const investment = await getUserInvestment(args.investment, ctx.user.id);

        // One price per day: adding a price for a day that already has
        // one replaces it, keeping the day's row.
        const existing = (
          await db
            .select()
            .from(investmentPrices)
            .where(
              and(
                eq(investmentPrices.investment, investment.id),
                eq(investmentPrices.date, args.date),
              ),
            )
            .limit(1)
        )[0];

        const pricePoint = existing
          ? (
              await db
                .update(investmentPrices)
                .set({ price: args.price })
                .where(eq(investmentPrices.id, existing.id))
                .returning()
            )[0]
          : (
              await db
                .insert(investmentPrices)
                .values({
                  id: args.id,
                  user: ctx.user.id,
                  investment: investment.id,
                  date: args.date,
                  price: args.price,
                })
                .returning()
            )[0];
        if (!pricePoint) {
          throw new GraphQLError("Failed to save investment price");
        }

        await addEvent({
          type: "addInvestmentPrice",
          payload: {
            id: pricePoint.id,
            investment: pricePoint.investment,
            date: pricePoint.date.toISOString(),
            price: pricePoint.price,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return pricePoint;
      },
    }),
  );

  builder.mutationField("updateInvestmentPrice", (t) =>
    t.field({
      type: InvestmentPriceSchema,
      args: {
        id: t.arg({ type: "String" }),
        date: t.arg({ type: "Date", required: false }),
        price: t.arg.float({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const pricePoint = (
          await db
            .select()
            .from(investmentPrices)
            .where(
              and(
                like(investmentPrices.id, idPattern(args.id)),
                eq(investmentPrices.user, ctx.user.id),
              ),
            )
        )[0];
        if (!pricePoint) {
          throw new GraphQLError("Investment price not found");
        }

        const updates: Partial<typeof pricePoint> = {};
        if (args.date != null) {
          updates.date = args.date;
        }
        if (args.price != null) {
          updates.price = args.price;
        }

        const updatedPricePoint = (
          await db
            .update(investmentPrices)
            .set(updates)
            .where(eq(investmentPrices.id, pricePoint.id))
            .returning()
        )[0];
        if (!updatedPricePoint) {
          throw new GraphQLError("Failed to update investment price");
        }

        await addEvent({
          type: "updateInvestmentPrice",
          payload: {
            id: pricePoint.id,
            investment: pricePoint.investment,
            ...(updatedPricePoint.date !== pricePoint.date
              ? { date: updatedPricePoint.date.toISOString() }
              : {}),
            ...(updates.price !== undefined ? { price: updatedPricePoint.price } : {}),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedPricePoint;
      },
    }),
  );

  builder.mutationField("deleteInvestmentPrice", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const pricePoint = (
          await db
            .select()
            .from(investmentPrices)
            .where(
              and(
                like(investmentPrices.id, idPattern(args.id)),
                eq(investmentPrices.user, ctx.user.id),
              ),
            )
        )[0];
        if (!pricePoint) {
          throw new GraphQLError("Investment price not found");
        }

        await db.delete(investmentPrices).where(eq(investmentPrices.id, pricePoint.id));

        await addEvent({
          type: "deleteInvestmentPrice",
          payload: {
            id: pricePoint.id,
            investment: pricePoint.investment,
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
