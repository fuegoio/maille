/**
 * Asset depreciation: a plan that owns a schedule of monthly activities.
 *
 * The plan is the source of truth — its generated activities are plain
 * ledger rows carrying a link back to it (`activity.depreciation`), so
 * changing the plan can regenerate exactly the ones the plan still
 * owns (those dated today or later) while past ones stay frozen
 * history.
 */

export type AssetDepreciationMethod = "linear";

export type AssetDepreciation = {
  id: string;
  asset: string;
  method: AssetDepreciationMethod;
  /** The amount the schedule spreads over its months. */
  basis: number;
  /** How many monthly installments the basis is spread over. */
  months: number;
  /** The 1st of the first depreciated month. */
  startMonth: Date;
  /** The expense account the depreciation is booked to. */
  expenseAccount: string;
  category: string | null;
  subcategory: string | null;
};

export type DepreciationInstallment = {
  /** The 1st of the month, at local midnight like every ledger date. */
  date: Date;
  amount: number;
};

/**
 * The 1st of the month, at local midnight — the canonical installment
 * date, matching how the rest of the ledger reads its dates.
 */
export const firstOfMonth = (year: number, monthIndex: number): Date =>
  new Date(year, monthIndex, 1);

/** The same day-of-month-1, `months` later; year rollovers normalize. */
export const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

/** The month a date falls in, as a comparable "yyyy-mm" key. */
export const depreciationMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/**
 * The plan's installments: one per month on the 1st, the basis divided
 * evenly. Amounts are real floats like every ledger figure — the final
 * installment can carry division dust below the reconciliation epsilon.
 */
export function depreciationInstallments(
  plan: Pick<AssetDepreciation, "basis" | "months" | "startMonth">,
): DepreciationInstallment[] {
  const amount = plan.basis / plan.months;
  return Array.from({ length: plan.months }, (_, index) => ({
    date: addMonths(plan.startMonth, index),
    amount,
  }));
}

/** The activity name every generated installment carries. */
export const depreciationActivityName = (assetName: string): string =>
  `Depreciation — ${assetName}`;

/** True when the date is still part of the plan's managed future: today or later. */
export const isDepreciationManaged = (date: Date, now: Date = new Date()): boolean =>
  date.getTime() >= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
