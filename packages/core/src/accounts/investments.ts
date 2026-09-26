import type { Transaction } from "../activities/types";
import { latestValueAt } from "../valuations";

export type Investment = {
  id: string;
  account: string;
  name: string;
  symbol: string | null;
  description: string | null;
  /**
   * The baseline units held before any ledger movement: the position's
   * opening state, like an account's starting balance. Units held at any
   * date derive from it plus the transaction legs referencing the
   * investment.
   */
  initialQuantity: number;
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
 * Units held: the initial quantity plus every leg quantity flowing in,
 * minus every leg quantity flowing out. Callers pass only the
 * transactions dated at or before the date they ask about: future
 * activities are previsions, and do not count until their date arrives.
 */
export function investmentQuantityAt(
  investment: Investment,
  transactions: readonly Transaction[],
): number {
  let quantity = investment.initialQuantity;
  for (const transaction of transactions) {
    if (transaction.toInvestment === investment.id) {
      quantity += transaction.toQuantity ?? 0;
    }
    if (transaction.fromInvestment === investment.id) {
      quantity -= transaction.fromQuantity ?? 0;
    }
  }
  return quantity;
}

/**
 * The investment's market value at `at`: units held (derived from the
 * ledger legs) times the unit price in effect then. Null when unpriced:
 * the caller decides how absence is displayed, and never books it.
 */
export function investmentValueAt(
  investment: Investment,
  transactions: readonly Transaction[],
  prices: readonly InvestmentPrice[],
  at: Date,
): number | null {
  const price = latestInvestmentPrice(prices, investment.id, at);
  if (price === null) return null;
  return investmentQuantityAt(investment, transactions) * price.price;
}
