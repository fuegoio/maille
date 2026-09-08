import { AccountType } from "@maille/core/accounts";

import { db } from "@/database";
import { accounts, fundMoves } from "@/tables";
import { and, eq, inArray, like } from "drizzle-orm";
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
 *
 * Legs only pin funds on balance accounts, so the accounts involved gate
 * which sides a leg may use: a transfer (both sides balance) may use either
 * side, a transaction leaving the fund system (balance to P&L) may only
 * draw its fromFund, one entering it (P&L to balance) may only feed its
 * toFund, and a P&L to P&L transaction holds no positions at all.
 */
export const insertTransactionFundMoves = async (params: {
  userId: string;
  transactionId: string;
  transactionDate: Date;
  amount: number;
  fromAccount: string;
  toAccount: string;
  fundMovesInput: FundMoveInput[] | null | undefined;
}) => {
  const { userId, transactionId, amount, fundMovesInput } = params;

  if (!fundMovesInput || fundMovesInput.length === 0) return [];

  const accountRows = await db
    .select({ id: accounts.id, type: accounts.type })
    .from(accounts)
    .where(
      and(eq(accounts.user, userId), inArray(accounts.id, [params.fromAccount, params.toAccount])),
    );
  const typeById = new Map(accountRows.map((row) => [row.id, row.type]));
  const isBalanceAccount = (accountId: string) => {
    const type = typeById.get(accountId);
    return type !== undefined && type !== AccountType.EXPENSE && type !== AccountType.REVENUE;
  };
  const fromIsBalance = isBalanceAccount(params.fromAccount);
  const toIsBalance = isBalanceAccount(params.toAccount);

  const legs = fundMovesInput.filter((leg) => leg.amount > 0 && (leg.fromFund || leg.toFund));

  if (legs.length > 0 && !fromIsBalance && !toIsBalance) {
    throw new GraphQLError("Fund moves need a balance account on one side of the transaction");
  }
  if (fromIsBalance && !toIsBalance) {
    for (const leg of legs) {
      if (leg.toFund) {
        throw new GraphQLError("A fund leg cannot enter a fund on this transaction's to account");
      }
    }
  }
  if (!fromIsBalance && toIsBalance) {
    for (const leg of legs) {
      if (leg.fromFund) {
        throw new GraphQLError("A fund leg cannot leave a fund on this transaction's from account");
      }
    }
  }

  const allocated = legs.reduce((total, leg) => total + leg.amount, 0);
  if (allocated - amount > 0.005) {
    throw new GraphQLError("Fund moves exceed the transaction amount");
  }

  const values = legs.map((leg) => ({
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
