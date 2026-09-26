import { latestValueAt } from "../valuations";

export type Investment = {
  id: string;
  account: string;
  name: string;
  symbol: string | null;
  description: string | null;
  /**
   * Units held: shares, coins, fund parts; fractional is valid.
   * Whole-position investments (a contract, a rental property) are
   * quantity 1.
   */
  quantity: number;
};

/**
 * A dated observation of the investment's unit price. The price is per
 * unit, in the user's currency; for quantity-1 investments it is simply
 * the position's value.
 */
export type InvestmentPrice = {
  id: string;
  investment: string;
  date: Date;
  price: number;
};

/** All price points of one investment, newest first. */
export function investmentPrices(
  prices: readonly InvestmentPrice[],
  investmentId: string,
): InvestmentPrice[] {
  return prices
    .filter((price) => price.investment === investmentId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * The unit price in effect at `at`: the latest point at or before it.
 * Null means the investment has never been priced: no value exists,
 * as opposed to a value of zero.
 */
export function latestInvestmentPrice(
  prices: readonly InvestmentPrice[],
  investmentId: string,
  at: Date,
): InvestmentPrice | null {
  return latestValueAt(
    prices.filter((price) => price.investment === investmentId),
    at,
  );
}

/**
 * The investment's market value at `at`: quantity times the unit price
 * in effect then. Null when unpriced: the caller decides how absence
 * is displayed, and never books it.
 */
export function investmentValueAt(
  investment: Investment,
  prices: readonly InvestmentPrice[],
  at: Date,
): number | null {
  const price = latestInvestmentPrice(prices, investment.id, at);
  return price === null ? null : investment.quantity * price.price;
}
