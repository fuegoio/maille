import { AccountType } from "@maille/core/accounts";
import type { FundMove } from "@maille/core/funds";

import { db } from "@/database";
import { accounts } from "@/tables";
import { and, eq, inArray } from "drizzle-orm";
import { GraphQLError } from "graphql";
import type { FundMoveInput, TransactionFundMove } from "./types";

/**
 * A transaction's fund legs, stored on its row.
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
 *
 * Fund moves date with their activity: the caller passes the activity's
 * date and every leg carries it.
 */
export const buildTransactionFundMoves = async (params: {
  userId: string;
  transactionDate: Date;
  amount: number;
  fromAccount: string;
  toAccount: string;
  fundMovesInput: FundMoveInput[] | null | undefined;
}): Promise<TransactionFundMove[]> => {
  const { userId, transactionDate, amount, fundMovesInput } = params;

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

  return legs.map((leg) => ({
    id: leg.id,
    fromFund: leg.fromFund ?? null,
    toFund: leg.toFund ?? null,
    amount: leg.amount,
    date: transactionDate.toISOString(),
    note: leg.note ?? null,
  }));
};

/**
 * A transaction's legs as complete fund moves (dates as Date), the shape
 * GraphQL serves and the core replay consumes.
 */
export const toFundMoves = (
  transactionId: string,
  legs: TransactionFundMove[] | null | undefined,
): FundMove[] =>
  (legs ?? []).map((leg) => ({
    ...leg,
    date: new Date(leg.date),
    transaction: transactionId,
  }));

/**
 * Serialize fund moves for sync event payloads (dates as ISO strings).
 */
export const serializeFundMoves = (moves: FundMove[]) =>
  moves.map((move) => ({
    ...move,
    date: move.date.toISOString(),
  }));
