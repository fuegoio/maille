import { db } from "@/database";
import { DEFAULT_FUND_COLOR } from "@maille/core/funds";
import { builder } from "../builder";
import { FundSchema, FundMoveSchema } from "./schemas";
import { funds, fundMoves } from "@/tables";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "../events";
import { and, eq, isNull, like } from "drizzle-orm";
import { GraphQLError } from "graphql";

/**
 * Resolve a fund id prefix to the full id, defaulting to the input when
 * no fund matches (mirrors how account ids are handled elsewhere).
 */
export const resolveFundId = async (userId: string, fundId: string | null) => {
  if (!fundId) return null;
  return (
    (
      await db
        .select({ id: funds.id })
        .from(funds)
        .where(and(like(funds.id, idPattern(fundId)), eq(funds.user, userId)))
        .limit(1)
    )[0]?.id ?? fundId
  );
};

export const registerFundsMutations = () => {
  builder.mutationField("createFund", (t) =>
    t.field({
      type: FundSchema,
      args: {
        id: t.arg({ type: "String" }),
        name: t.arg.string(),
        color: t.arg.string({ required: false }),
        startDate: t.arg({ type: "Date", required: false }),
        endDate: t.arg({ type: "Date", required: false }),
      },
      resolve: async (root, args, ctx) => {
        const created = (
          await db
            .insert(funds)
            .values({
              id: args.id,
              user: ctx.user.id,
              name: args.name,
              color: args.color ?? DEFAULT_FUND_COLOR,
              startDate: args.startDate,
              endDate: args.endDate,
            })
            .returning()
        )[0];

        if (!created) {
          throw new GraphQLError("Failed to create fund");
        }

        await addEvent({
          type: "createFund",
          payload: {
            id: created.id,
            name: created.name,
            color: created.color,
            startDate: created.startDate?.toISOString() ?? null,
            endDate: created.endDate?.toISOString() ?? null,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return created;
      },
    }),
  );

  builder.mutationField("updateFund", (t) =>
    t.field({
      type: FundSchema,
      args: {
        id: t.arg({ type: "String" }),
        name: t.arg.string({ required: false }),
        color: t.arg.string({ required: false }),
        startDate: t.arg({ type: "Date", required: false }),
        endDate: t.arg({ type: "Date", required: false }),
      },
      resolve: async (root, args, ctx) => {
        const fund = (
          await db
            .select()
            .from(funds)
            .where(and(like(funds.id, idPattern(args.id)), eq(funds.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!fund) {
          throw new GraphQLError("Fund not found");
        }

        const updates: Partial<typeof fund> = {};
        if (args.name !== undefined && args.name !== null) updates.name = args.name;
        if (args.color !== undefined && args.color !== null) updates.color = args.color;
        if (args.startDate !== undefined) {
          updates.startDate = args.startDate;
          if (args.startDate === null) updates.endDate = null;
        }
        if (args.endDate !== undefined) updates.endDate = args.endDate;

        const updated = (
          await db.update(funds).set(updates).where(eq(funds.id, fund.id)).returning()
        )[0];
        if (!updated) {
          throw new GraphQLError("Failed to update fund");
        }

        await addEvent({
          type: "updateFund",
          payload: {
            id: updated.id,
            ...updates,
            startDate: updates.startDate === null ? null : updates.startDate?.toISOString(),
            endDate: updates.endDate === null ? null : updates.endDate?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updated;
      },
    }),
  );

  builder.mutationField("deleteFund", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const fund = (
          await db
            .select()
            .from(funds)
            .where(and(like(funds.id, idPattern(args.id)), eq(funds.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!fund) {
          throw new GraphQLError("Fund not found");
        }

        // The deleted fund's legs go back to Untracked (a null side), so the
        // counterpart funds keep their history.
        await db.update(fundMoves).set({ fromFund: null }).where(eq(fundMoves.fromFund, fund.id));
        await db.update(fundMoves).set({ toFund: null }).where(eq(fundMoves.toFund, fund.id));
        // Moves with both sides untracked carry no information: drop them.
        await db
          .delete(fundMoves)
          .where(
            and(
              eq(fundMoves.user, ctx.user.id),
              isNull(fundMoves.fromFund),
              isNull(fundMoves.toFund),
            ),
          );

        await db.delete(funds).where(eq(funds.id, fund.id));

        await addEvent({
          type: "deleteFund",
          payload: { id: fund.id },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return true;
      },
    }),
  );

  builder.mutationField("createFundMove", (t) =>
    t.field({
      type: FundMoveSchema,
      args: {
        id: t.arg({ type: "String" }),
        fromFund: t.arg({ type: "String", required: false }),
        toFund: t.arg({ type: "String", required: false }),
        amount: t.arg({ type: "Float" }),
        date: t.arg({ type: "Date" }),
        note: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        if (!args.fromFund && !args.toFund) {
          throw new GraphQLError("A fund move needs a fromFund or a toFund");
        }
        if (args.fromFund && args.toFund && args.fromFund === args.toFund) {
          throw new GraphQLError("A fund move cannot target the same fund");
        }
        if (args.amount <= 0) {
          throw new GraphQLError("A fund move amount must be positive");
        }

        const fromFund = await resolveFundId(ctx.user.id, args.fromFund ?? null);
        const toFund = await resolveFundId(ctx.user.id, args.toFund ?? null);

        const created = (
          await db
            .insert(fundMoves)
            .values({
              id: args.id,
              user: ctx.user.id,
              fromFund,
              toFund,
              amount: args.amount,
              date: args.date,
              note: args.note,
              transaction: null,
            })
            .returning()
        )[0];
        if (!created) {
          throw new GraphQLError("Failed to create fund move");
        }

        await addEvent({
          type: "createFundMove",
          payload: {
            ...created,
            date: created.date.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return created;
      },
    }),
  );

  builder.mutationField("updateFundMove", (t) =>
    t.field({
      type: FundMoveSchema,
      args: {
        id: t.arg({ type: "String" }),
        fromFund: t.arg({ type: "String", required: false }),
        toFund: t.arg({ type: "String", required: false }),
        amount: t.arg({ type: "Float", required: false }),
        date: t.arg({ type: "Date", required: false }),
        note: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const move = (
          await db
            .select()
            .from(fundMoves)
            .where(and(like(fundMoves.id, idPattern(args.id)), eq(fundMoves.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!move) {
          throw new GraphQLError("Fund move not found");
        }
        if (move.transaction) {
          throw new GraphQLError("Fund moves linked to a transaction cannot be updated");
        }

        const updates: Partial<typeof move> = {};
        if (args.fromFund !== undefined) {
          updates.fromFund = await resolveFundId(ctx.user.id, args.fromFund);
        }
        if (args.toFund !== undefined) {
          updates.toFund = await resolveFundId(ctx.user.id, args.toFund);
        }
        if (args.amount !== undefined && args.amount !== null) updates.amount = args.amount;
        if (args.date !== undefined && args.date !== null) updates.date = args.date;
        if (args.note !== undefined) updates.note = args.note;

        if (updates.amount !== undefined && updates.amount <= 0) {
          throw new GraphQLError("A fund move amount must be positive");
        }
        const newFrom = updates.fromFund ?? move.fromFund;
        const newTo = updates.toFund ?? move.toFund;
        if (newFrom && newTo && newFrom === newTo) {
          throw new GraphQLError("A fund move cannot target the same fund");
        }
        if (!newFrom && !newTo) {
          throw new GraphQLError("A fund move needs a fromFund or a toFund");
        }

        const updated = (
          await db.update(fundMoves).set(updates).where(eq(fundMoves.id, move.id)).returning()
        )[0];
        if (!updated) {
          throw new GraphQLError("Failed to update fund move");
        }

        await addEvent({
          type: "updateFundMove",
          payload: {
            id: updated.id,
            ...updates,
            date: updates.date === null ? null : updates.date?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updated;
      },
    }),
  );

  builder.mutationField("deleteFundMove", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const move = (
          await db
            .select()
            .from(fundMoves)
            .where(and(like(fundMoves.id, idPattern(args.id)), eq(fundMoves.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!move) {
          throw new GraphQLError("Fund move not found");
        }
        if (move.transaction) {
          throw new GraphQLError("Fund moves linked to a transaction cannot be deleted");
        }

        await db.delete(fundMoves).where(eq(fundMoves.id, move.id));

        await addEvent({
          type: "deleteFundMove",
          payload: { id: move.id },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return true;
      },
    }),
  );
};
