import { db } from "@/database";
import { DEFAULT_FUND_COLOR, wouldCreateCycle } from "@maille/core/funds";
import { builder } from "../builder";
import { FundAllocationSchema, FundSchema } from "./schemas";
import { fundAllocations, funds, fundMoves } from "@/tables";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "../events";
import { and, eq, isNull, like } from "drizzle-orm";
import { GraphQLError } from "graphql";
import {
  getFundAllocations,
  getFundEarliestAllocatedTransactionDate,
  resolveAllocationCandidates,
  validateFundAllocations,
} from "./allocations";

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

/**
 * Resolve a parent fund id, rejecting ids that match no fund: a parent
 * pointer must land somewhere real or stay null.
 */
const resolveParentFundId = async (userId: string, parentFund: string | null) => {
  if (!parentFund) return null;
  const resolved = (await resolveFundId(userId, parentFund)) ?? parentFund;
  const exists = (
    await db
      .select({ id: funds.id })
      .from(funds)
      .where(and(eq(funds.id, resolved), eq(funds.user, userId)))
      .limit(1)
  )[0];
  if (!exists) {
    throw new GraphQLError("Parent fund not found");
  }
  return resolved;
};

/** Every fund of a user, as tree-logic input for cycle checks. */
const getUserFunds = async (userId: string) =>
  db.select().from(funds).where(eq(funds.user, userId));

/** Fetch a fund by id prefix, or throw when no fund matches. */
const getFundById = async (userId: string, fundId: string) => {
  const fund = (
    await db
      .select()
      .from(funds)
      .where(and(like(funds.id, idPattern(fundId)), eq(funds.user, userId)))
      .limit(1)
  )[0];
  if (!fund) {
    throw new GraphQLError("Fund not found");
  }
  return fund;
};

const FundAllocationInput = builder.inputType("FundAllocationInput", {
  fields: (t) => ({
    id: t.field({ type: "String" }),
    account: t.field({ type: "String" }),
    amount: t.float(),
  }),
});

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
        parentFund: t.arg({ type: "String", required: false }),
      },
      resolve: async (root, args, ctx) => {
        const parentFund = await resolveParentFundId(ctx.user.id, args.parentFund ?? null);
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
              parentFund,
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
            parentFund: created.parentFund,
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
        parentFund: t.arg({ type: "String", required: false }),
      },
      resolve: async (root, args, ctx) => {
        const fund = await getFundById(ctx.user.id, args.id);

        const updates: Partial<typeof fund> = {};
        if (args.name !== undefined && args.name !== null) updates.name = args.name;
        if (args.color !== undefined && args.color !== null) updates.color = args.color;
        if (args.startDate !== undefined) {
          updates.startDate = args.startDate;
          if (args.startDate === null) updates.endDate = null;
        }
        if (args.endDate !== undefined) updates.endDate = args.endDate;
        if (args.parentFund !== undefined) {
          updates.parentFund = await resolveParentFundId(ctx.user.id, args.parentFund);
          if (wouldCreateCycle(fund.id, updates.parentFund, await getUserFunds(ctx.user.id))) {
            throw new GraphQLError("A fund cannot be nested under itself or one of its children");
          }
        }

        if (updates.startDate !== undefined) {
          if (updates.startDate) {
            const earliest = await getFundEarliestAllocatedTransactionDate({
              userId: ctx.user.id,
              fundId: fund.id,
            });
            if (earliest && updates.startDate.getTime() > earliest.getTime()) {
              throw new GraphQLError(
                "The fund start date is after transactions already allocated to it",
              );
            }
          }
          const existingAllocations = await getFundAllocations(ctx.user.id, fund.id);
          if (existingAllocations.length > 0) {
            await validateFundAllocations({
              userId: ctx.user.id,
              fund: { id: fund.id, startDate: updates.startDate ?? null },
              allocations: existingAllocations,
            });
          }
        }

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
        const fund = await getFundById(ctx.user.id, args.id);

        // Splice: the deleted fund's children are promoted to its own
        // parent — deleting a node never deletes or orphans its subtree.
        await db
          .update(funds)
          .set({ parentFund: fund.parentFund })
          .where(eq(funds.parentFund, fund.id));

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

        await db.delete(fundAllocations).where(eq(fundAllocations.fund, fund.id));

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

  builder.mutationField("setFundAllocations", (t) =>
    t.field({
      type: [FundAllocationSchema],
      args: {
        fund: t.arg({ type: "String" }),
        allocations: t.arg({ type: [FundAllocationInput] }),
      },
      resolve: async (root, args, ctx) => {
        const fund = await getFundById(ctx.user.id, args.fund);

        const allocations = await resolveAllocationCandidates({
          userId: ctx.user.id,
          allocations: args.allocations,
        });

        await validateFundAllocations({
          userId: ctx.user.id,
          fund,
          allocations,
        });

        // Replace-all semantics: the submitted rows are the fund's whole
        // opening position.
        await db.delete(fundAllocations).where(eq(fundAllocations.fund, fund.id));

        const inserted =
          allocations.length === 0
            ? []
            : await db
                .insert(fundAllocations)
                .values(
                  allocations.map((allocation) => ({
                    id: allocation.id,
                    user: ctx.user.id,
                    fund: fund.id,
                    account: allocation.account,
                    amount: allocation.amount,
                  })),
                )
                .returning();

        await addEvent({
          type: "updateFundAllocations",
          payload: {
            fund: fund.id,
            allocations: inserted.map((allocation) => ({
              id: allocation.id,
              account: allocation.account,
              amount: allocation.amount,
            })),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return inserted;
      },
    }),
  );
};
