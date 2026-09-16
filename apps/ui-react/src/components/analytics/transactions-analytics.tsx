import { useMemo } from "react";

import type { AnalyticsConfig } from "@/stores/analytics";

import {
  countMetric,
  inMetric,
  netMetric,
  outMetric,
  TEMPORAL_BUCKETS,
  NONE_DIMENSION,
  type AnalyticsBucket,
  type AnalyticsDatum,
  type AnalyticsDimension,
  type AnalyticsMetric,
} from "@/components/analytics/analytics-data";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { searchCompare } from "@/lib/strings";
import { getAccountTransactions } from "@/logic/accounts";
import { useActivities } from "@/stores/activities";
import { useViewSearch } from "@/stores/search";

const TRANSACTIONS_METRICS: AnalyticsMetric[] = [
  countMetric,
  inMetric,
  outMetric,
  netMetric,
];

const TRANSACTIONS_BUCKETS: AnalyticsBucket[] = [
  ...TEMPORAL_BUCKETS,
  { key: "fund", label: "Fund", dimension: "fund" },
  { key: "counterpart", label: "Counterpart", dimension: "counterpart" },
  { key: "category", label: "Category", dimension: "category" },
];

const TRANSACTIONS_DIMENSIONS: AnalyticsDimension[] = [
  NONE_DIMENSION,
  { key: "fund", label: "Fund", dimension: "fund" },
  { key: "counterpart", label: "Counterpart", dimension: "counterpart" },
  { key: "category", label: "Category", dimension: "category" },
  { key: "direction", label: "Direction", dimension: "direction" },
];

interface TransactionsAnalyticsProps {
  accountId: string;
  /** Keep only transactions holding this fund on the account's side; null is Untracked. */
  fundFilter?: string | null;
  /** The view the chart configuration persists under. */
  viewId: string;
  defaults: AnalyticsConfig;
  fullView?: boolean;
}

/**
 * The account's transactions as analytics: any metric (count, in, out,
 * net) over any bucket (time, fund, counterpart, category), grouped by
 * any dimension — the chart above the table of the plotted data.
 */
export function TransactionsAnalytics({
  accountId,
  fundFilter,
  viewId,
  defaults,
  fullView = false,
}: TransactionsAnalyticsProps) {
  const activities = useActivities((state) => state.activities);
  const { search } = useViewSearch();

  const data = useMemo<AnalyticsDatum[]>(() => {
    const transactions = getAccountTransactions(activities, accountId);

    return transactions
      .filter((t) => searchCompare(search, t.activity.name))
      .filter((t) => (fundFilter === undefined ? true : t.fund === fundFilter))
      .map((t) => ({
        date: t.date,
        count: 1,
        amount: t.direction === "in" ? t.amount : -t.amount,
        in: t.direction === "in" ? t.amount : 0,
        out: t.direction === "out" ? t.amount : 0,
        fund: t.fund,
        counterpart: t.counterpart,
        category: t.activity.category,
        subcategory: t.activity.subcategory,
        direction: t.direction,
      }));
  }, [activities, accountId, search, fundFilter]);

  return (
    <AnalyticsView
      viewId={viewId}
      data={data}
      metrics={TRANSACTIONS_METRICS}
      buckets={TRANSACTIONS_BUCKETS}
      dimensions={TRANSACTIONS_DIMENSIONS}
      defaults={defaults}
      fullView={fullView}
    />
  );
}
