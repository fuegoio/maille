import type { Activity, Transaction } from "@maille/core/activities";

import {
  investmentQuantityAt,
  investmentValueAt,
  latestInvestmentPrice,
  type Investment,
  type InvestmentPrice,
} from "@maille/core/accounts";

export { investmentPrices, latestInvestmentPrice } from "@maille/core/accounts";

/**
 * A transaction as the investment sees it: which leg touches the
 * position and whether units flow in (a buy) or out (a sell).
 */
export type InvestmentTransaction = {
  activity: Activity;
  transaction: Transaction;
  direction: "in" | "out";
};

/**
 * Every transaction coming and going from the investment, in activity
 * order.
 */
export function investmentTransactions(
  activities: readonly Activity[],
  investmentId: string,
): InvestmentTransaction[] {
  const result: InvestmentTransaction[] = [];

  for (const activity of activities) {
    for (const transaction of activity.transactions) {
      let direction: "in" | "out" | null = null;
      if (transaction.toInvestment === investmentId) direction = "in";
      else if (transaction.fromInvestment === investmentId) direction = "out";
      if (direction === null) continue;

      result.push({ activity, transaction, direction });
    }
  }

  return result;
}

/** The end of today: prices land whole days, values never peek ahead. */
export const endOfToday = (now: Date = new Date()) =>
  new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();

/**
 * The transactions that count for a quantity held "as of" a date: the
 * activity has landed, so its legs are real units, not previsions.
 */
export function investmentTransactionsThrough(
  activities: readonly Activity[],
  investmentId: string,
  at: Date,
): Transaction[] {
  const atTime = at.getTime();
  return investmentTransactions(activities, investmentId)
    .filter(({ activity }) => activity.date.getTime() <= atTime)
    .map(({ transaction }) => transaction);
}

/**
 * The investment's market value as of `at`: units held (derived from
 * the ledger legs) times the unit price in effect then.
 */
export function investmentValueAsOf(
  investment: Investment,
  activities: readonly Activity[],
  prices: readonly InvestmentPrice[],
  at: Date,
): number | null {
  return investmentValueAt(
    investment,
    investmentTransactionsThrough(activities, investment.id, at),
    prices,
    at,
  );
}

/** Units held as of `at`: the ledger legs plus the initial quantity. */
export function investmentQuantityAsOf(
  investment: Investment,
  activities: readonly Activity[],
  at: Date,
): number {
  return investmentQuantityAt(
    investment,
    investmentTransactionsThrough(activities, investment.id, at),
  );
}

/** The money that came in and went out of the position, as two totals. */
export function getInvestmentTotals(
  activities: readonly Activity[],
  investmentId: string,
): { in: number; out: number; quantityIn: number; quantityOut: number } {
  return investmentTransactions(activities, investmentId).reduce(
    (
      totals,
      { transaction, direction },
    ): { in: number; out: number; quantityIn: number; quantityOut: number } => {
      if (direction === "in") {
        totals.in += transaction.amount;
        totals.quantityIn += transaction.toQuantity ?? 0;
      } else {
        totals.out += transaction.amount;
        totals.quantityOut += transaction.fromQuantity ?? 0;
      }
      return totals;
    },
    { in: 0, out: 0, quantityIn: 0, quantityOut: 0 },
  );
}

/** What an account's positions or assets are worth at `at`, for the summary. */
export type AccountEstimation = {
  /** Sum of the observed positions' values. */
  value: number;
  /** Positions or assets with at least one observation at or before `at`. */
  valued: number;
  /** Every position or asset in the account, observed or not. */
  positions: number;
  /** The most recent observation date the estimation rests on. */
  asOf: Date | null;
};

/**
 * The account's market estimation: the sum of its positions' values at
 * their latest price, units derived from the ledger legs. Null when
 * the account holds no position or none is priced: absence is honest,
 * and never a zero.
 */
export function getAccountEstimation(
  investments: readonly Investment[],
  activities: readonly Activity[],
  prices: readonly InvestmentPrice[],
  accountId: string,
  at: Date,
): AccountEstimation | null {
  const accountPositions = investments.filter(
    (investment) => investment.account === accountId,
  );
  if (accountPositions.length === 0) return null;

  let value = 0;
  let valued = 0;
  let asOf: Date | null = null;
  for (const investment of accountPositions) {
    const price = latestInvestmentPrice(prices, investment.id, at);
    if (price === null) continue;
    valued += 1;
    value +=
      investmentValueAt(
        investment,
        investmentTransactionsThrough(activities, investment.id, at),
        prices,
        at,
      ) ?? 0;
    if (asOf === null || price.date.getTime() > asOf.getTime()) {
      asOf = price.date;
    }
  }

  if (valued === 0) return null;
  return { value, valued, positions: accountPositions.length, asOf };
}
