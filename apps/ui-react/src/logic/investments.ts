import {
  investmentValueAt,
  latestInvestmentPrice,
  type Investment,
  type InvestmentPrice,
} from "@maille/core/accounts";

export {
  investmentPrices,
  investmentValueAt,
  latestInvestmentPrice,
} from "@maille/core/accounts";

/** What an account's positions are worth at `at`, for the summary. */
export type AccountEstimation = {
  /** Sum of the priced positions' values. */
  value: number;
  /** Positions with at least one price at or before `at`. */
  priced: number;
  /** Every position in the account, priced or not. */
  positions: number;
  /** The most recent price date the estimation rests on. */
  asOf: Date | null;
};

/**
 * The account's market estimation: the sum of its positions' values at
 * their latest price. Null when the account holds no position or none
 * is priced — absence is honest, and never a zero.
 */
export function getAccountEstimation(
  investments: readonly Investment[],
  prices: readonly InvestmentPrice[],
  accountId: string,
  at: Date,
): AccountEstimation | null {
  const accountPositions = investments.filter(
    (investment) => investment.account === accountId,
  );
  if (accountPositions.length === 0) return null;

  let value = 0;
  let priced = 0;
  let asOf: Date | null = null;
  for (const investment of accountPositions) {
    const price = latestInvestmentPrice(prices, investment.id, at);
    if (price === null) continue;
    priced += 1;
    value += investmentValueAt(investment, prices, at) ?? 0;
    if (asOf === null || price.date.getTime() > asOf.getTime()) {
      asOf = price.date;
    }
  }

  if (priced === 0) return null;
  return { value, priced, positions: accountPositions.length, asOf };
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
