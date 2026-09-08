import type { Account } from "@maille/core/accounts";
import type { Activity } from "@maille/core/activities";
import type { Fund, FundMove } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import { getFundBalance, getFundDescendants } from "@maille/core/funds";
import { addDays, startOfDay } from "date-fns";

export const getFundsBalances = (funds: Fund[], fundMoves: FundMove[]) =>
  funds.map((fund) => ({
    fund,
    balance: getFundBalance(fund.id, fundMoves),
  }));

/** The ids of a fund and every fund below it in the tree. */
const getTreeIds = (fundId: string, funds: Fund[]): Set<string> =>
  new Set([fundId, ...getFundDescendants(fundId, funds)]);

/**
 * A subtree's balance at the end of the given day: money that entered the
 * tree minus money that left it. Moves between funds inside the tree cancel
 * out; moves crossing the boundary count once on the inside side.
 */
export const getFundTreeBalanceAtDate = (
  fundId: string,
  funds: Fund[],
  fundMoves: FundMove[],
  date: Date,
): number => {
  const ids = getTreeIds(fundId, funds);
  return fundMoves
    .filter((m) => m.date.getTime() < addDays(startOfDay(date), 1).getTime())
    .reduce(
      (total, m) =>
        total +
        (m.toFund && ids.has(m.toFund) ? m.amount : 0) -
        (m.fromFund && ids.has(m.fromFund) ? m.amount : 0),
      0,
    );
};

/** A subtree's rollup balance: every move's effect on the tree, summed. */
export const getFundTreeBalance = (
  fundId: string,
  funds: Fund[],
  fundMoves: FundMove[],
): number => {
  const ids = getTreeIds(fundId, funds);
  return fundMoves.reduce(
    (total, m) =>
      total +
      (m.toFund && ids.has(m.toFund) ? m.amount : 0) -
      (m.fromFund && ids.has(m.fromFund) ? m.amount : 0),
    0,
  );
};

/**
 * Money crossing a subtree's boundary within [from, to], both days inclusive:
 * in comes from outside the tree (Untracked or a foreign branch), out leaves
 * it. For a leaf this is exactly its own moves; for a parent it hides the
 * internal reshuffling between its children.
 */
export const getFundTreeFlowsBetweenDates = (
  fundId: string,
  funds: Fund[],
  fundMoves: FundMove[],
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
  return { in: inflow, out: outflow };
};

/** A fund's own balance, excluding its children's. */
export const getFundDirectBalance = (
  fundId: string,
  fundMoves: FundMove[],
): number => getFundBalance(fundId, fundMoves);

/** A fund's direct children, name-sorted. */
export const getFundChildren = (fundId: string, funds: Fund[]): Fund[] =>
  funds
    .filter((fund) => fund.parentFund === fundId)
    .sort((a, b) => a.name.localeCompare(b.name));

/** A fund's balance at the end of the given day. */
export const getFundBalanceAtDate = (
  fundId: string,
  fundMoves: FundMove[],
  date: Date,
): number =>
  fundMoves
    .filter((m) => m.date.getTime() < addDays(startOfDay(date), 1).getTime())
    .reduce(
      (total, m) =>
        total +
        (m.toFund === fundId ? m.amount : 0) -
        (m.fromFund === fundId ? m.amount : 0),
      0,
    );

/**
 * Untracked is the complement of the funds: money sitting in balance
 * accounts that no fund claims. It is the balance accounts' total minus
 * the total held by funds, both computed up to the given date. Untracked
 * money moves (a null side) only ever relabel it, so they are not summed
 * here — the untracked total also grows with unallocated income and
 * shrinks with untracked spending, which carry no fund move at all.
 */
export function getUntrackedBalanceAtDate({
  accounts,
  activities,
  fundMoves,
  date,
  startingDate,
}: {
  accounts: Account[];
  activities: Activity[];
  fundMoves: FundMove[];
  date: Date;
  startingDate: Date;
}): number {
  const day = startOfDay(date);

  const isBalanceAccount = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return (
      account !== undefined &&
      account.type !== AccountType.REVENUE &&
      account.type !== AccountType.EXPENSE
    );
  };

  const startingBalance = accounts
    .filter(
      (a) => a.type !== AccountType.REVENUE && a.type !== AccountType.EXPENSE,
    )
    .reduce((sum, a) => sum + (a.startingBalance ?? 0), 0);

  const transactionsTotal = activities
    .filter((a) => a.date >= startingDate && startOfDay(a.date) <= day)
    .flatMap((a) => a.transactions)
    .reduce((sum, t) => {
      const fromIsBalance = isBalanceAccount(t.fromAccount);
      const toIsBalance = isBalanceAccount(t.toAccount);
      if (fromIsBalance && !toIsBalance) return sum - t.amount;
      if (!fromIsBalance && toIsBalance) return sum + t.amount;
      return sum;
    }, 0);

  const fundsTotal = fundMoves
    .filter((m) => startOfDay(m.date) <= day)
    .reduce(
      (total, m) =>
        total + (m.toFund ? m.amount : 0) - (m.fromFund ? m.amount : 0),
      0,
    );

  return startingBalance + transactionsTotal - fundsTotal;
}
