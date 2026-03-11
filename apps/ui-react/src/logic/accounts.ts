import { startOfDay } from "date-fns";

import type { Account } from "@maille/core/accounts";
import type { Activity } from "@maille/core/activities";

import { AccountType } from "@maille/core/accounts";

export function getAccountBalanceAtDate({
  accountId,
  date,
  activities,
  accounts,
  startingDate,
  flow,
  rangeStart,
}: {
  accountId: string;
  date?: Date;
  activities: Activity[];
  accounts: Account[];
  startingDate: Date;
  flow?: "in" | "out";
  rangeStart?: Date;
}): number {
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return 0;

  const transactionsTotal = activities
    .filter((a) => a.date >= startingDate)
    .filter((a) => {
      const d = startOfDay(a.date);
      if (rangeStart && d < rangeStart) return false;
      if (!date) return true;
      return d <= startOfDay(date);
    })
    .flatMap((a) => a.transactions)
    .filter(
      (t) =>
        ((flow === "in" || flow === undefined) && t.toAccount === accountId) ||
        ((flow === "out" || flow === undefined) && t.fromAccount === accountId),
    )
    .reduce((acc, t) => {
      if (t.fromAccount === accountId) return acc - t.amount;
      return acc + t.amount;
    }, 0);

  if (flow) return transactionsTotal;
  return (account.startingBalance ?? 0) + transactionsTotal;
}

export function getAccountsBalance({
  accountType,
  monthDate,
  activities,
  accounts,
  startDate,
}: {
  accountType: AccountType;
  monthDate: Date;
  activities: Activity[];
  accounts: Account[];
  startDate?: Date;
}) {
  const revenueAccounts = accounts
    .filter((account) => account.type === accountType)
    .map((account) => account.id);
  const revenue = activities
    .filter((a) => a.date >= (startDate ?? new Date(0)))
    .filter((a) => a.date.getMonth() === monthDate.getMonth())
    .flatMap((a) => a.transactions)
    .filter(
      (t) =>
        revenueAccounts.includes(t.fromAccount) ||
        revenueAccounts.includes(t.toAccount),
    )
    .reduce((acc, t) => {
      if (revenueAccounts.includes(t.fromAccount)) {
        return acc - t.amount;
      } else {
        return acc + t.amount;
      }
    }, 0);

  return revenue;
}

export function getBalanceForMonth({
  monthDate,
  startingDate,
  activities,
  accounts,
}: {
  monthDate: Date;
  startingDate: Date;
  activities: Activity[];
  accounts: Account[];
}): number {
  const revenue =
    getAccountsBalance({
      accountType: AccountType.REVENUE,
      monthDate,
      activities,
      accounts,
      startDate: startingDate,
    }) * -1;

  const expense = getAccountsBalance({
    accountType: AccountType.EXPENSE,
    monthDate,
    activities,
    accounts,
    startDate: startingDate,
  });

  if (monthDate.getMonth() === startingDate.getMonth()) {
    const startingBalance = accounts
      .filter(
        (a) => ![AccountType.REVENUE, AccountType.EXPENSE].includes(a.type),
      )
      .reduce((total, account) => total + (account.startingBalance ?? 0), 0);
    return startingBalance + revenue - expense;
  }

  // Calculate the balance for the previous month
  const previousMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1,
  );
  const previousBalance = getBalanceForMonth({
    monthDate: previousMonth,
    startingDate,
    activities,
    accounts,
  });

  // Compute the balance for the current month
  return previousBalance + revenue - expense;
}
