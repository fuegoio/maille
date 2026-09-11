import { AccountType } from "#accounts/index.ts";
import type { Account } from "#accounts/index.ts";
import type { Transaction } from "#activities/types.ts";
import { addDays, startOfDay } from "date-fns";

import type { Fund, FundAllocation } from "./types";

/**
 * Fund positions: where each account's balance sits across funds.
 *
 * A position is the amount of one account's balance that belongs to one
 * fund; null is Untracked, the complement of the fund system. Two
 * invariants hold at every point of the replay, and they are the two
 * questions the feature answers:
 *
 * - per account:  Σ_position position(account, fund) = account balance
 * - per fund:     Σ_account position(account, fund) = fund balance
 *
 * Positions are never stored: they are replayed from the ledger (starting
 * balances, opening allocations, transactions and their fund legs) so they
 * stay consistent with it by construction.
 */

/** One account's balance split across funds; null is Untracked. */
export type FundComposition = Map<string | null, number>;

/** Transactions grouped under their activity's date, as the replay consumes them. */
export type DatedTransactions = { date: Date; transactions: Transaction[] }[];

export type PositionsInput = {
  accounts: Pick<Account, "id" | "type" | "startingBalance">[];
  funds: Fund[];
  fundAllocations: FundAllocation[];
  activities: DatedTransactions;
  /** The user's starting date: accounts seed here, earlier activities are ignored. */
  startingDate: Date | null;
  /** Replay events up to the end of this day; defaults to everything. */
  date?: Date;
};

const isBalanceAccount = (account: Pick<Account, "id" | "type"> | undefined) =>
  account !== undefined &&
  account.type !== AccountType.EXPENSE &&
  account.type !== AccountType.REVENUE;

/**
 * The date an allocation lands on: the fund's start date, falling back to
 * the user's starting date, and never before it (no ledger exists earlier).
 */
export const getAllocationDate = (
  fund: Pick<Fund, "startDate">,
  startingDate: Date | null,
): Date => {
  const base = fund.startDate ?? startingDate;
  if (!base || !startingDate) return base ?? new Date(0);
  return base.getTime() < startingDate.getTime() ? startingDate : base;
};

const adjust = (composition: FundComposition, fund: string | null, delta: number) => {
  composition.set(fund, (composition.get(fund) ?? 0) + delta);
};

type ReplayEvent =
  | { kind: "allocation"; date: Date; id: string; allocation: FundAllocation }
  | { kind: "transaction"; date: Date; id: string; transaction: Transaction };

/**
 * Replay the ledger into positions: each balance account starts with its
 * starting balance as Untracked, opening allocations claim parts of it for
 * funds at their start dates, and every transaction moves composition
 * between accounts through its fund legs — the unlegged remainder travels
 * Untracked, so unassigned money stays unassigned.
 *
 * Same-day ordering is deterministic: allocations land before the day's
 * transactions (the opening earmark precedes the flows), then by id.
 */
export function computePositions(input: PositionsInput): Map<string, FundComposition> {
  const fundsById = new Map(input.funds.map((fund) => [fund.id, fund]));

  const positions = new Map<string, FundComposition>();
  for (const account of input.accounts) {
    if (!isBalanceAccount(account)) continue;
    positions.set(account.id, new Map([[null, account.startingBalance ?? 0]]));
  }

  const events: ReplayEvent[] = [];
  for (const allocation of input.fundAllocations) {
    const fund = fundsById.get(allocation.fund);
    if (!fund) continue;
    events.push({
      kind: "allocation",
      date: getAllocationDate(fund, input.startingDate),
      id: allocation.id,
      allocation,
    });
  }
  for (const activity of input.activities) {
    if (input.startingDate && activity.date < input.startingDate) continue;
    for (const transaction of activity.transactions) {
      events.push({
        kind: "transaction",
        date: activity.date,
        id: transaction.id,
        transaction,
      });
    }
  }
  events.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }
    // Allocations first: earmark the opening money, then run the day's flows.
    if (a.kind !== b.kind) return a.kind === "allocation" ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  // Positions are read "as of the end of this day", like every other
  // date-aware balance in the codebase.
  const cutoff = input.date
    ? addDays(startOfDay(input.date), 1).getTime()
    : Number.POSITIVE_INFINITY;
  const passesCutoff = (date: Date) => date.getTime() < cutoff;

  for (const event of events) {
    if (!passesCutoff(event.date)) continue;

    if (event.kind === "allocation") {
      const composition = positions.get(event.allocation.account);
      if (!composition) continue;
      adjust(composition, event.allocation.fund, event.allocation.amount);
      adjust(composition, null, -event.allocation.amount);
      continue;
    }

    const { transaction } = event;
    const from = positions.get(transaction.fromAccount);
    const to = positions.get(transaction.toAccount);
    const legs = (transaction.fundMoves ?? []).filter((leg) => leg.amount > 0);
    const remainder = Math.max(
      0,
      transaction.amount - legs.reduce((sum, leg) => sum + leg.amount, 0),
    );

    if (from && to) {
      // Balance-to-balance: only the legs carry fund identity. Each leg is
      // a pair — the fromFund side leaves the source account, the toFund
      // side lands in the destination — and the unlegged remainder travels
      // Untracked to Untracked so the account totals still balance.
      for (const leg of legs) {
        adjust(from, leg.fromFund ?? null, -leg.amount);
        adjust(to, leg.toFund ?? null, leg.amount);
      }
      adjust(from, null, -remainder);
      adjust(to, null, remainder);
    } else if (from) {
      // Money out of one balance account: legs draw their fund (a leg is
      // conventionally a fromFund here), the unlegged remainder draws
      // Untracked.
      for (const leg of legs) {
        adjust(from, leg.fromFund ?? leg.toFund ?? null, -leg.amount);
      }
      adjust(from, null, -remainder);
    } else if (to) {
      // Money into one balance account: legs feed their fund, the unlegged
      // remainder lands Untracked.
      for (const leg of legs) {
        adjust(to, leg.toFund ?? leg.fromFund ?? null, leg.amount);
      }
      adjust(to, null, remainder);
    }
    // Neither side is a balance account: no position to move.
  }

  return positions;
}

/**
 * One fund's spread across accounts, the transpose of the matrix: for each
 * account holding the fund, how much of it sits there.
 */
export function getFundAccountPositions(
  positions: Map<string, FundComposition>,
  fundId: string,
): Map<string, number> {
  const byAccount = new Map<string, number>();
  for (const [accountId, composition] of positions) {
    const amount = composition.get(fundId) ?? 0;
    if (amount !== 0) byAccount.set(accountId, amount);
  }
  return byAccount;
}

/**
 * The Untracked position of every account at a date: what no fund claims.
 * Validation of opening allocations uses the same replay — an allocation
 * fits exactly when it keeps every account's Untracked non-negative.
 */
export function getUntrackedByAccountAtDate(input: PositionsInput): Map<string, number> {
  const positions = computePositions(input);
  const untracked = new Map<string, number>();
  for (const [accountId, composition] of positions) {
    untracked.set(accountId, composition.get(null) ?? 0);
  }
  return untracked;
}
