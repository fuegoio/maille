import type { Account } from "@maille/core/accounts";
import type { Activity } from "@maille/core/activities";

import { AccountType } from "@maille/core/accounts";
import { startOfDay } from "date-fns";

/** The balance accounts: everything except the two P&L account types. */
const getBalanceAccountIds = (accounts: Account[]): Set<string> =>
  new Set(
    accounts
      .filter(
        (account) =>
          account.type !== AccountType.REVENUE &&
          account.type !== AccountType.EXPENSE,
      )
      .map((account) => account.id),
  );

/**
 * The balance of every balance account combined at the end of the given
 * day: opening balances plus every ledger flow that has landed by then.
 * A date before the ledger's starting date still answers with the
 * starting balances, because no activity exists before it.
 */
export function getBalanceAtDate({
  accounts,
  activities,
  startingDate,
  date,
}: {
  accounts: Account[];
  activities: Activity[];
  startingDate: Date;
  date: Date;
}): number {
  const balanceAccountIds = getBalanceAccountIds(accounts);

  const startingBalance = accounts
    .filter((account) => balanceAccountIds.has(account.id))
    .reduce((total, account) => total + (account.startingBalance ?? 0), 0);

  const day = startOfDay(date);
  const flowsTotal = activities
    .filter((a) => startOfDay(a.date) <= day && a.date >= startingDate)
    .flatMap((a) => a.transactions)
    .reduce((total, t) => {
      const fromIsBalance = balanceAccountIds.has(t.fromAccount);
      const toIsBalance = balanceAccountIds.has(t.toAccount);
      if (fromIsBalance && !toIsBalance) return total - t.amount;
      if (!fromIsBalance && toIsBalance) return total + t.amount;
      return total;
    }, 0);

  return startingBalance + flowsTotal;
}

/**
 * The revenue or expense total of a window: the money that left revenue
 * accounts or entered expense accounts, both reported as positive amounts.
 */
export function getFlowTotalBetweenDates({
  accounts,
  activities,
  startingDate,
  from,
  to,
  type,
}: {
  accounts: Account[];
  activities: Activity[];
  startingDate: Date;
  from: Date;
  to: Date;
  type: AccountType.REVENUE | AccountType.EXPENSE;
}): number {
  const targetAccountIds = new Set(
    accounts.filter((account) => account.type === type).map((a) => a.id),
  );

  const start = startOfDay(from);
  const end = startOfDay(to);
  return activities
    .filter((a) => a.date >= startingDate)
    .filter((a) => {
      const day = startOfDay(a.date);
      return day >= start && day <= end;
    })
    .flatMap((a) => a.transactions)
    .reduce((total, t) => {
      if (type === AccountType.REVENUE && targetAccountIds.has(t.fromAccount)) {
        return total + t.amount;
      }
      if (type === AccountType.EXPENSE && targetAccountIds.has(t.toAccount)) {
        return total + t.amount;
      }
      return total;
    }, 0);
}
