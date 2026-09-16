import type { Movement } from "@maille/core/movements";

import { useMemo } from "react";

import type { AnalyticsConfig } from "@/stores/analytics";

import {
  countMetric,
  inMetric,
  netMetric,
  outMetric,
  reconciledMetric,
  TEMPORAL_BUCKETS,
  NONE_DIMENSION,
  type AnalyticsBucket,
  type AnalyticsDatum,
  type AnalyticsDimension,
  type AnalyticsMetric,
} from "@/components/analytics/analytics-data";
import { AnalyticsView } from "@/components/analytics/analytics-view";

const MOVEMENTS_METRICS: AnalyticsMetric[] = [
  countMetric,
  inMetric,
  outMetric,
  netMetric,
  reconciledMetric,
];

const MOVEMENTS_BUCKETS: AnalyticsBucket[] = [
  ...TEMPORAL_BUCKETS,
  { key: "account", label: "Account", dimension: "account" },
  { key: "status", label: "Status", dimension: "status" },
];

const MOVEMENTS_DIMENSIONS: AnalyticsDimension[] = [
  NONE_DIMENSION,
  { key: "account", label: "Account", dimension: "account" },
  { key: "status", label: "Status", dimension: "status" },
  { key: "direction", label: "Direction", dimension: "direction" },
];

interface MovementsAnalyticsProps {
  /** The movements as the table sees them: same set, same filters. */
  movements: Movement[];
  /** The view the chart configuration persists under. */
  viewId: string;
  defaults: AnalyticsConfig;
  fullView?: boolean;
}

/**
 * Movements analytics: any metric (count, in, out, net, reconciled)
 * over any bucket (time, account, status), grouped by any dimension —
 * the chart above the table of the plotted data.
 */
export function MovementsAnalytics({
  movements,
  viewId,
  defaults,
  fullView = false,
}: MovementsAnalyticsProps) {
  const data = useMemo<AnalyticsDatum[]>(
    () =>
      movements.map((movement) => ({
        date: movement.date,
        count: 1,
        amount: movement.amount,
        in: Math.max(movement.amount, 0),
        out: Math.max(-movement.amount, 0),
        reconciled:
          movement.status === "completed" ? Math.abs(movement.amount) : 0,
        account: movement.account,
        status: movement.status,
        direction: movement.amount >= 0 ? "in" : "out",
      })),
    [movements],
  );

  return (
    <AnalyticsView
      viewId={viewId}
      data={data}
      metrics={MOVEMENTS_METRICS}
      buckets={MOVEMENTS_BUCKETS}
      dimensions={MOVEMENTS_DIMENSIONS}
      defaults={defaults}
      fullView={fullView}
    />
  );
}
