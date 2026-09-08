import type { Account } from "@maille/core/accounts";
import type { Activity } from "@maille/core/activities";
import type { Fund, FundAllocation, FundMove } from "@maille/core/funds";
import type { PositionsInput } from "@maille/core/funds";

import {
  computePositions,
  getAllocationDate,
  getFundAccountPositions,
  getFundBalance,
  getFundDescendants,
  getUntrackedByAccountAtDate as coreUntrackedByAccount,
} from "@maille/core/funds";
import { addDays, startOfDay } from "date-fns";

export { getFundTreeBalance } from "@maille/core/funds";

export const getFundsBalances = (
  funds: Fund[],
  fundMoves: FundMove[],
  fundAllocations: FundAllocation[] = [],
) =>
  funds.map((fund) => ({
    fund,
    balance: getFundBalance(fund.id, fundMoves, fundAllocations),
  }));

/** The ids of a fund and every fund below it in the tree. */
const getTreeIds = (fundId: string, funds: Fund[]): Set<string> =>
  new Set([fundId, ...getFundDescendants(fundId, funds)]);

const cutoffOf = (date: Date) => addDays(startOfDay(date), 1).getTime();

/** The share of some funds' opening allocations that has landed by the cutoff. */
const allocatedBefore = (
  fundIds: Set<string>,
  funds: Fund[],
  fundAllocations: FundAllocation[],
  startingDate: Date,
  cutoff: number,
) => {
  const fundById = new Map(funds.map((fund) => [fund.id, fund]));
  return fundAllocations.reduce((total, allocation) => {
    if (!fundIds.has(allocation.fund)) return total;
    const fund = fundById.get(allocation.fund);
    if (!fund) return total;
    return getAllocationDate(fund, startingDate).getTime() < cutoff
      ? total + allocation.amount
      : total;
  }, 0);
};

/**
 * A subtree's balance at the end of the given day: money that entered the
 * tree minus money that left it, plus the opening allocations that have
 * landed by then. Moves between funds inside the tree cancel out; moves
 * crossing the boundary count once on the inside side.
 */
export const getFundTreeBalanceAtDate = (
  fundId: string,
  funds: Fund[],
  fundMoves: FundMove[],
  fundAllocations: FundAllocation[],
  startingDate: Date,
  date: Date,
): number => {
  const ids = getTreeIds(fundId, funds);
  const cutoff = cutoffOf(date);
  return (
    fundMoves
      .filter((m) => m.date.getTime() < cutoff)
      .reduce(
        (total, m) =>
          total +
          (m.toFund && ids.has(m.toFund) ? m.amount : 0) -
          (m.fromFund && ids.has(m.fromFund) ? m.amount : 0),
        0,
      ) + allocatedBefore(ids, funds, fundAllocations, startingDate, cutoff)
  );
};

/** A fund's own balance, excluding its children's. */
export const getFundDirectBalance = (
  fundId: string,
  fundMoves: FundMove[],
  fundAllocations: FundAllocation[] = [],
): number => getFundBalance(fundId, fundMoves, fundAllocations);

/** A fund's direct children, name-sorted. */
export const getFundChildren = (fundId: string, funds: Fund[]): Fund[] =>
  funds
    .filter((fund) => fund.parentFund === fundId)
    .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Money crossing a subtree's boundary within [from, to], both days inclusive:
 * in comes from outside the tree (Untracked or a foreign branch), out leaves
 * it. Opening allocations land from Untracked, so one falling inside the
 * window is an inflow. For a leaf this is exactly its own moves; for a
 * parent it hides the internal reshuffling between its children.
 */
export const getFundTreeFlowsBetweenDates = (
  fundId: string,
  funds: Fund[],
  fundMoves: FundMove[],
  fundAllocations: FundAllocation[],
  startingDate: Date,
  from: Date,
  to: Date,
): { in: number; out: number } => {
  const ids = getTreeIds(fundId, funds);
  const start = startOfDay(from).getTime();
  const end = addDays(startOfDay(to), 1).getTime();
  let inflow = 0;
  let outflow = 0;
  for (const m of fundMoves) {
    if (m.date.getTime() < start || m.date.getTime() >= end) continue;
    const toInside = m.toFund !== null && ids.has(m.toFund);
    const fromInside = m.fromFund !== null && ids.has(m.fromFund);
    if (toInside && !fromInside) inflow += m.amount;
    if (fromInside && !toInside) outflow += m.amount;
  }
  inflow +=
    allocatedBefore(ids, funds, fundAllocations, startingDate, end) -
    allocatedBefore(ids, funds, fundAllocations, startingDate, start);
  return { in: inflow, out: outflow };
};

/**
 * Opening allocations landing inside [from, to]: money claimed out of
 * Untracked by funds starting in the window.
 */
export const getAllocationsLandedBetweenDates = (
  funds: Fund[],
  fundAllocations: FundAllocation[],
  startingDate: Date,
  from: Date,
  to: Date,
): number => {
  const ids = new Set(funds.map((fund) => fund.id));
  return (
    allocatedBefore(
      ids,
      funds,
      fundAllocations,
      startingDate,
      addDays(startOfDay(to), 1).getTime(),
    ) -
    allocatedBefore(
      ids,
      funds,
      fundAllocations,
      startingDate,
      startOfDay(from).getTime(),
    )
  );
};

/**
 * Assemble the ledger shape the core positions replay consumes: activities
 * with their transactions, each carrying the fund legs held by the funds
 * store.
 */
export function toPositionsInput({
  accounts,
  activities,
  funds,
  fundMoves,
  fundAllocations,
  startingDate,
  date,
}: {
  accounts: Account[];
  activities: Activity[];
  funds: Fund[];
  fundMoves: FundMove[];
  fundAllocations: FundAllocation[];
  startingDate: Date;
  date?: Date;
}): PositionsInput {
  const legsByTransaction = new Map<string, FundMove[]>();
  for (const move of fundMoves) {
    if (move.transaction === null) continue;
    const legs = legsByTransaction.get(move.transaction) ?? [];
    legs.push(move);
    legsByTransaction.set(move.transaction, legs);
  }

  return {
    accounts,
    funds,
    fundAllocations,
    activities: activities.map((activity) => ({
      date: activity.date,
      transactions: activity.transactions.map((transaction) => ({
        ...transaction,
        fundMoves: legsByTransaction.get(transaction.id) ?? [],
      })),
    })),
    startingDate,
    date,
  };
}

/** The Untracked position of every account at the given date. */
export function getUntrackedByAccountAtDate(input: {
  accounts: Account[];
  activities: Activity[];
  funds: Fund[];
  fundMoves: FundMove[];
  fundAllocations: FundAllocation[];
  date: Date;
  startingDate: Date;
}): Map<string, number> {
  return coreUntrackedByAccount(toPositionsInput(input));
}

/**
 * Untracked is the complement of the funds: money sitting in balance
 * accounts that no fund claims, replayed through positions so it agrees
 * with the per-account breakdown.
 */
export function getUntrackedBalanceAtDate(input: {
  accounts: Account[];
  activities: Activity[];
  funds: Fund[];
  fundMoves: FundMove[];
  fundAllocations: FundAllocation[];
  date: Date;
  startingDate: Date;
}): number {
  return [...getUntrackedByAccountAtDate(input).values()].reduce(
    (total, amount) => total + amount,
    0,
  );
}

/**
 * A fund's spread across accounts, from the replayed positions: for each
 * account holding the fund, how much of it sits there.
 */
export function getFundSpreadAcrossAccounts(
  input: Parameters<typeof toPositionsInput>[0] & { fundId: string },
): Map<string, number> {
  return getFundAccountPositions(
    computePositions(toPositionsInput(input)),
    input.fundId,
  );
}

/**
 * One account's balance split across funds, from the replayed positions:
 * the fund composition of its balance, null being Untracked.
 */
export function getAccountSpreadAcrossFunds(
  input: Parameters<typeof toPositionsInput>[0] & { accountId: string },
): Map<string | null, number> {
  return (
    computePositions(toPositionsInput(input)).get(input.accountId) ??
    new Map([[null, 0]])
  );
}
