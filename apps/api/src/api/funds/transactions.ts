import { db } from "@/database";
import { fundMoves } from "@/tables";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";
import type { FundMoveInput } from "./types";

/**
 * Insert fund moves linked to a transaction.
 *
 * Semantics of a fund leg relative to a transaction:
 * - fromFund: money leaves this fund (expense, investment purchase)
 * - toFund: money enters this fund (revenue, refund, sale of investment)
 * - Neither: the transaction's money is not tracked in the fund system
 *   (balance-sheet accounts transfers between accounts)
 *
 * "Untracked" (a null side) is the default fund: when the sum of provided
 * legs is below the transaction amount, the remainder simply stays
 * untracked — no balancing leg is created. Over-allocation is rejected:
 * more purpose than money cannot exist.
 */
export const insertTransactionFundMoves = async (params: {
  userId: string;
  transactionId: string;
  transactionDate: Date;
  amount: number;
  fundMovesInput: FundMoveInput[] | null | undefined;
}) => {
  const { userId, transactionId, amount, fundMovesInput } = params;

  if (!fundMovesInput || fundMovesInput.length === 0) return [];

  const allocated = fundMovesInput.reduce((total, move) => total + move.amount, 0);
  if (allocated - amount > 0.005) {
    throw new GraphQLError("Fund moves exceed the transaction amount");
  }

  const values = fundMovesInput
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
