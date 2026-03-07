import { AccountType } from "@maille/core/accounts";
import type { Account } from "@maille/core/accounts";
import type { Activity } from "@maille/core/activities";

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
  // Calculate the balance for the previous month
  const previousMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() - 1,
    1,
  );
  const previousBalance =
    previousMonth >= new Date(startingDate)
      ? getBalanceForMonth({
          monthDate: previousMonth,
          startingDate,
          activities,
          accounts,
        })
      : accounts.reduce(
          (total, account) => total + (account.startingBalance ?? 0),
          0,
        );

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

  // Compute the balance for the current month
  return previousBalance + revenue - expense;
}
