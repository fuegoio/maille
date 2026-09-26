import { latestValueAt } from "../valuations";

export type Asset = {
  id: string;
  account: string;
  name: string;
  description: string | null;
  location: string | null;
};

/**
 * A dated observation of the asset's estimated value, an appraisal or
 * trusted comp. The whole asset's value, not a unit price. It is the
 * valuation layer: displayed next to the ledger's book value, never
 * booked.
 */
export type AssetValuation = {
  id: string;
  asset: string;
  date: Date;
  value: number;
};

/** All valuations of one asset, newest first. */
export function assetValuations(
  valuations: readonly AssetValuation[],
  assetId: string,
): AssetValuation[] {
  return valuations
    .filter((valuation) => valuation.asset === assetId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * The estimated value in effect at `at`: the latest valuation at or
 * before it. Null means the asset has never been valued: no estimate
 * exists, as opposed to an estimate of zero.
 */
export function latestAssetValuation(
  valuations: readonly AssetValuation[],
  assetId: string,
  at: Date,
): AssetValuation | null {
  return latestValueAt(
    valuations.filter((valuation) => valuation.asset === assetId),
    at,
  );
}
