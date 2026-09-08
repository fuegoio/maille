import type { Account } from "@maille/core/accounts";
import type { Activity } from "@maille/core/activities";
import type { Fund, FundMove } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import { getFundBalance } from "@maille/core/funds";
import { startOfDay } from "date-fns";

export const getFundsBalances = (funds: Fund[], fundMoves: FundMove[]) =>
  funds.map((fund) => ({
    fund,
    balance: getFundBalance(fund.id, fundMoves),
  }));

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
