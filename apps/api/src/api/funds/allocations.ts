import { AccountType } from "@maille/core/accounts";
import { getAllocationDate, getUntrackedByAccountAtDate } from "@maille/core/funds";
import type { FundAccount } from "@maille/core/funds";
import type { PositionsInput } from "@maille/core/funds";

import { db } from "@/database";
import { accounts, activities, fundAccounts, fundMoves, funds, transactions } from "@/tables";
import { user as userTable } from "@/tables";

import { and, eq, or } from "drizzle-orm";
import { GraphQLError } from "graphql";

type AccountRow = typeof accounts.$inferSelect;
type FundRow = typeof funds.$inferSelect;

/**
 * Load a user's whole ledger in the shape the core positions replay
 * consumes: accounts, funds, opening allocations, and activities with their
 * transactions and fund legs.
 */
export const loadPositionsInput = async (
  userId: string,
  options: { excludeFundAccountsOf?: string } = {},
): Promise<PositionsInput> => {
  const [userRow] = await db
    .select({ startingDate: userTable.startingDate })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  const [accountRows, fundRows, allocationRows, transactionRows, moveRows] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.user, userId)),
    db.select().from(funds).where(eq(funds.user, userId)),
    db.select().from(fundAccounts).where(eq(fundAccounts.user, userId)),
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        fromAccount: transactions.fromAccount,
        toAccount: transactions.toAccount,
        activity: activities.id,
        activityDate: activities.date,
      })
      .from(transactions)
      .innerJoin(activities, eq(transactions.activity, activities.id))
      .where(eq(activities.user, userId)),
    db.select().from(fundMoves).where(eq(fundMoves.user, userId)),
  ]);

  const movesByTransaction = new Map<string, typeof moveRows>();
  for (const move of moveRows) {
    const legs = movesByTransaction.get(move.transaction) ?? [];
    legs.push(move);
    movesByTransaction.set(move.transaction, legs);
  }

  const transactionsByActivity = new Map<string, { date: Date; transactions: unknown[] }>();
  for (const row of transactionRows) {
    const entry = transactionsByActivity.get(row.activity) ?? {
      date: row.activityDate,
      transactions: [],
    };
    (entry.transactions as PositionsInput["activities"][number]["transactions"]).push({
      id: row.id,
      amount: row.amount,
      fromAccount: row.fromAccount,
      toAccount: row.toAccount,
      fundMoves: movesByTransaction.get(row.id) ?? [],
    });
    transactionsByActivity.set(row.activity, entry);
  }

  const accountsByFund = new Map<string, FundAccount[]>();
  for (const row of allocationRows) {
    const list = accountsByFund.get(row.fund) ?? [];
    list.push({ id: row.id, fund: row.fund, account: row.account, amount: row.amount });
    accountsByFund.set(row.fund, list);
  }

  return {
    accounts: accountRows,
    funds: fundRows.map((fund) => ({
      ...fund,
      accounts: accountsByFund.get(fund.id) ?? [],
    })),
    fundAccounts: allocationRows.filter(
      (allocation) => allocation.fund !== options.excludeFundAccountsOf,
    ),
    activities: [...transactionsByActivity.values()] as PositionsInput["activities"],
    startingDate: userRow?.startingDate ?? null,
  };
};

export type AccountCandidate = {
  account: string;
  amount: number;
};

/**
 * Validate a fund's opening allocations against the ledger: replayed up to
 * the fund's start date (excluding the fund's own current allocations, they
 * are being replaced), each touched account must have enough Untracked to
 * cover what is being claimed. Over-allocating would push Untracked below
 * zero — more purpose than money.
 */
export const validateFundAccounts = async (params: {
  userId: string;
  fund: Pick<FundRow, "id" | "startDate">;
  accounts: AccountCandidate[];
}) => {
  if (params.accounts.length === 0) return;

  const [userRow] = await db
    .select({ startingDate: userTable.startingDate })
    .from(userTable)
    .where(eq(userTable.id, params.userId))
    .limit(1);

  const input = await loadPositionsInput(params.userId, {
    excludeFundAccountsOf: params.fund.id,
  });

  const untracked = getUntrackedByAccountAtDate({
    ...input,
    date: getAllocationDate(params.fund, input.startingDate),
  });

  // Sum the claims per account, then check each against its Untracked
  const claimed = new Map<string, number>();
  for (const allocation of params.accounts) {
    claimed.set(allocation.account, (claimed.get(allocation.account) ?? 0) + allocation.amount);
  }

  const accountRows = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(eq(accounts.user, params.userId));
  const accountNames = new Map(accountRows.map((account) => [account.id, account.name]));
  const allocationDate = getAllocationDate(params.fund, userRow?.startingDate ?? null);

  for (const [accountId, amount] of claimed) {
    const available = untracked.get(accountId) ?? 0;
    if (amount - available > 0.005) {
      throw new GraphQLError(
        `Allocation on "${accountNames.get(accountId) ?? accountId}" exceeds what is available: ` +
          `${amount.toFixed(2)} requested, ${available.toFixed(2)} untracked ` +
          `at ${allocationDate.toISOString().split("T")[0]}`,
      );
    }
  }
};

/**
 * The earliest transaction already allocated to a fund: a start date after
 * it would make legs predate their fund.
 */
export const getFundEarliestAllocatedTransactionDate = async (params: {
  userId: string;
  fundId: string;
}): Promise<Date | null> => {
  const rows = await db
    .select({ date: activities.date })
    .from(fundMoves)
    .innerJoin(transactions, eq(fundMoves.transaction, transactions.id))
    .innerJoin(activities, eq(transactions.activity, activities.id))
    .where(
      and(
        eq(fundMoves.user, params.userId),
        eq(activities.user, params.userId),
        // A leg touches the fund from either side
        or(eq(fundMoves.fromFund, params.fundId), eq(fundMoves.toFund, params.fundId)),
      ),
    );

  const dates = rows.map((row) => row.date.getTime());
  if (dates.length === 0) return null;
  return new Date(Math.min(...dates));
};

/**
 * Resolve and validate allocation input rows: amounts must be positive, the
 * account must exist and be a balance account (P&L accounts hold no fund
 * money), and rows on the same account merge.
 */
export const resolveAccountCandidates = async (params: {
  userId: string;
  accounts: { id: string; account: string; amount: number }[];
}): Promise<{ id: string; account: string; amount: number }[]> => {
  const accountRows = await db.select().from(accounts).where(eq(accounts.user, params.userId));
  const accountById = new Map<string, AccountRow>(
    accountRows.map((account) => [account.id, account]),
  );

  const merged = new Map<string, { id: string; account: string; amount: number }>();
  for (const allocation of params.accounts) {
    if (allocation.amount <= 0) {
      throw new GraphQLError("An allocation amount must be positive");
    }
    const account = accountById.get(allocation.account);
    if (!account) {
      throw new GraphQLError(`Account not found for allocation: ${allocation.account}`);
    }
    if (account.type === AccountType.EXPENSE || account.type === AccountType.REVENUE) {
      throw new GraphQLError(`Funds cannot be allocated on the P&L account "${account.name}"`);
    }
    const existing = merged.get(allocation.account);
    if (existing) {
      existing.amount += allocation.amount;
    } else {
      merged.set(allocation.account, {
        id: allocation.id,
        account: allocation.account,
        amount: allocation.amount,
      });
    }
  }

  return [...merged.values()];
};

/** A fund's current allocations, serialized for a sync event payload. */
export const getFundAccounts = async (
  userId: string,
  fundId: string,
): Promise<FundAccount[]> =>
  db
    .select()
    .from(fundAccounts)
    .where(and(eq(fundAccounts.user, userId), eq(fundAccounts.fund, fundId)));
