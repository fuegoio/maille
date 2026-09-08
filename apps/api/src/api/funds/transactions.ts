import { db } from "@/database";
import { DEFAULT_FUND_COLOR } from "@maille/core/funds";
import { fundMoves, funds } from "@/tables";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";
import type { FundMoveInput } from "./types";

/**
 * Get (or lazily create) the user's default fund.
 */
export const getDefaultFund = async (userId: string) => {
  const existing = (
    await db
      .select()
      .from(funds)
      .where(and(eq(funds.user, userId), eq(funds.isDefault, true)))
      .limit(1)
  )[0];
  if (existing) return existing;

  const created = (
    await db
      .insert(funds)
      .values({
        id: crypto.randomUUID(),
        user: userId,
        name: "Liquid",
        color: DEFAULT_FUND_COLOR,
        isDefault: true,
      })
      .returning()
  )[0];
  if (!created) {
    throw new GraphQLError("Failed to create default fund");
  }
  return created;
};

/**
 * Insert fund moves linked to a transaction.
 *
 * Semantics of a fund leg relative to a transaction:
 * - fromFund: money leaves this fund (expense, investment purchase)
 * - toFund: money enters this fund (revenue, refund, sale of investment)
 * - Neither: the transaction's money is not tracked in the fund system
 *   (balance-sheet accounts transfers between accounts)
 *
 * When the sum of provided legs does not match the transaction amount,
 * the difference is assigned to/from the default fund if one exists, so
 * every tracked euro is fully allocated.
 */
export const insertTransactionFundMoves = async (params: {
  userId: string;
  transactionId: string;
  transactionDate: Date;
  amount: number;
  fundMovesInput: FundMoveInput[] | null | undefined;
  defaultFundId: string | null;
}) => {
  const { userId, transactionId, amount, fundMovesInput, defaultFundId } = params;

  if (!fundMovesInput || fundMovesInput.length === 0) return [];

  const allocated = fundMovesInput.reduce((total, move) => total + move.amount, 0);
  const legs: FundMoveInput[] = fundMovesInput.map((leg) => ({ ...leg }));

  if (Math.abs(allocated - amount) > 0.005 && defaultFundId) {
    const difference = amount - allocated;
    // Find an existing leg on the default fund to merge the difference into,
    // otherwise append a default-fund leg.
    const defaultLeg = legs.find(
      (leg) => leg.fromFund === defaultFundId || leg.toFund === defaultFundId,
    );
    if (difference < 0) {
      // Over-allocated: pull the excess out of the default fund side
      if (defaultLeg) {
        defaultLeg.amount = (defaultLeg.amount ?? 0) + difference;
      }
      // If no default leg exists and the allocation is over the amount,
      // trim proportionally is overkill — reject instead.
      else {
        throw new GraphQLError("Fund moves exceed the transaction amount");
      }
    } else {
      // Under-allocated: assign the remainder to the default fund
      if (defaultLeg) {
        defaultLeg.amount = (defaultLeg.amount ?? 0) + difference;
      } else {
        legs.push({
          id: crypto.randomUUID(),
          fromFund: defaultFundId,
          toFund: null,
          amount: difference,
          note: null,
        });
      }
    }
  }

  const values = legs
    .filter((leg) => leg.amount > 0)
    .map((leg) => ({
      id: leg.id,
      user: userId,
      fromFund: leg.fromFund ?? null,
      toFund: leg.toFund ?? null,
      amount: leg.amount,
      date: params.transactionDate,
      note: leg.note ?? null,
      transaction: transactionId,
    }));

  if (values.length === 0) return [];

  return await db.insert(fundMoves).values(values).returning();
};

/**
 * Serialize fund move rows for sync event payloads (dates as ISO strings).
 */
export const serializeFundMoves = (moves: (typeof fundMoves.$inferSelect)[]) =>
  moves.map((move) => ({
    ...move,
    date: move.date.toISOString(),
  }));

/**
 * Delete all fund moves linked to a transaction (used before re-inserting
 * on update, and by the database cascade on transaction deletion).
 */
export const deleteTransactionFundMoves = async (params: {
  userId: string;
  transactionId: string;
}) => {
  const existing = await db
    .select()
    .from(fundMoves)
    .where(
      and(like(fundMoves.transaction, params.transactionId), eq(fundMoves.user, params.userId)),
    );
  if (existing.length > 0) {
    await db
      .delete(fundMoves)
      .where(
        and(like(fundMoves.transaction, params.transactionId), eq(fundMoves.user, params.userId)),
      );
  }
  return existing;
};
