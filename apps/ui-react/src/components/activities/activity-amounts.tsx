import { ActivityType, type ActivityAmounts } from "@maille/core/activities";

import type { AmountPair } from "@/components/shared/amount-pairs";

import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { ACTIVITY_TYPES_COLOR } from "@/stores/activities";

/** The display order of the per-type amounts, matching the month and project
 * summary blocks: revenue, expense, investment, asset, neutral. */
const AMOUNTS_ORDER = [
  ActivityType.REVENUE,
  ActivityType.EXPENSE,
  ActivityType.INVESTMENT,
  ActivityType.ASSET,
  ActivityType.NEUTRAL,
] as const;

/**
 * An activity's per-type amounts as dot + amount pairs — the type's color
 * rides on the dot, the amount stays in the foreground color. Zero amounts
 * are omitted. Shared by activity rows, month group headers and filter
 * totals so the vocabulary stays identical everywhere.
 */
export function ActivityAmountsValue({
  amounts,
  className,
  types = AMOUNTS_ORDER,
  animated = false,
}: {
  amounts: ActivityAmounts;
  className?: string;
  types?: readonly ActivityType[];
  /** Roll amounts to their new value — for figures that change in place. */
  animated?: boolean;
}) {
  const pairs: AmountPair[] = types.map((activityType) => ({
    dot: ACTIVITY_TYPES_COLOR[activityType],
    amount: amounts[activityType],
  }));

  return (
    <AmountPairsValue pairs={pairs} className={className} animated={animated} />
  );
}
