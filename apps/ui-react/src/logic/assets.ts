import type { Activity, Transaction } from "@maille/core/activities";

/**
 * A transaction as the asset sees it: which leg touches the asset and
 * whether money flows in (the asset receives) or out (the asset gives).
 */
export type AssetTransaction = {
  activity: Activity;
  transaction: Transaction;
  direction: "in" | "out";
};

/**
 * Every transaction coming and going from the asset, in activity order.
 */
export function assetTransactions(
  activities: Activity[],
  assetId: string,
): AssetTransaction[] {
  const result: AssetTransaction[] = [];

  for (const activity of activities) {
    for (const transaction of activity.transactions) {
      let direction: "in" | "out" | null = null;
      if (transaction.toAsset === assetId) direction = "in";
      else if (transaction.fromAsset === assetId) direction = "out";
      if (direction === null) continue;

      result.push({ activity, transaction, direction });
    }
  }

  return result;
}

/**
 * The asset's current value: the money it has received minus the money it
 * has given, as of `now` — scheduled future transactions (a depreciation
 * schedule's, typically) don't count until their date arrives.
 */
export function getAssetValue(
  activities: Activity[],
  assetId: string,
  now: Date = new Date(),
): number {
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();

  return assetTransactions(activities, assetId).reduce(
    (total, { activity, transaction, direction }) =>
      activity.date.getTime() <= endOfToday
        ? direction === "in"
          ? total + transaction.amount
          : total - transaction.amount
        : total,
    0,
  );
}

/** An activity as the asset sees it: the activity, and how much of it flowed through the asset. */
export type AssetActivity = {
  activity: Activity;
  amount: number;
};

/**
 * Every activity touching the asset, newest first, with the sum of the
 * transactions that involve it. Depreciation-generated ones are
 * recognizable by their schedule link.
 */
export function assetActivities(
  activities: Activity[],
  assetId: string,
): AssetActivity[] {
  const result: AssetActivity[] = [];

  for (const activity of activities) {
    let amount = 0;
    let touches = false;
    for (const transaction of activity.transactions) {
      if (
        transaction.fromAsset === assetId ||
        transaction.toAsset === assetId
      ) {
        touches = true;
        amount += transaction.amount;
      }
    }
    if (touches) {
      result.push({ activity, amount });
    }
  }

  return result.sort(
    (a, b) => b.activity.date.getTime() - a.activity.date.getTime(),
  );
}

/** The money that came in and went out of the asset, as two totals. */
export function getAssetTotals(
  activities: Activity[],
  assetId: string,
): { in: number; out: number } {
  return assetTransactions(activities, assetId).reduce(
    (totals, { transaction, direction }) => {
      if (direction === "in") totals.in += transaction.amount;
      else totals.out += transaction.amount;
      return totals;
    },
    { in: 0, out: 0 },
  );
}
