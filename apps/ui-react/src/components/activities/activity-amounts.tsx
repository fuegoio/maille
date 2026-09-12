import { ActivityType, type ActivityAmounts } from "@maille/core/activities";

import type { AmountPair } from "@/components/shared/amount-pairs";

import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { ACTIVITY_TYPES_COLOR } from "@/stores/activities";

/** The display order of the per-type amounts, matching the month and project
 * summary blocks: revenue, expense, investment, neutral. */
const AMOUNTS_ORDER = [
  ActivityType.REVENUE,
  ActivityType.EXPENSE,
  ActivityType.INVESTMENT,
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
}: {
  amounts: ActivityAmounts;
  className?: string;
}) {
  const pairs: AmountPair[] = AMOUNTS_ORDER.map((activityType) => ({
    dot: ACTIVITY_TYPES_COLOR[activityType],
    amount: amounts[activityType],
  }));

  return <AmountPairsValue pairs={pairs} className={className} />;
}
