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
import { getFundMovesRows } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useViewSearch } from "@/stores/search";

const FUND_MOVES_METRICS: AnalyticsMetric[] = [
  countMetric,
  inMetric,
  outMetric,
  netMetric,
];

const FUND_MOVES_BUCKETS: AnalyticsBucket[] = [
  ...TEMPORAL_BUCKETS,
  {
    key: "counterpartFund",
    label: "Counterpart",
    dimension: "counterpartFund",
  },
  { key: "direction", label: "Direction", dimension: "direction" },
];

const FUND_MOVES_DIMENSIONS: AnalyticsDimension[] = [
  NONE_DIMENSION,
  {
    key: "counterpartFund",
    label: "Counterpart",
    dimension: "counterpartFund",
  },
  { key: "direction", label: "Direction", dimension: "direction" },
];

interface FundMovesAnalyticsProps {
  /** The fund whose moves to analyze; null is Untracked. */
  fundId: string | null;
  subtree?: boolean;
  /** Only moves whose transaction touches this account. */
  accountFilter?: string | null;
  /** The view the chart configuration persists under. */
  viewId: string;
  defaults: AnalyticsConfig;
  fullView?: boolean;
}

/**
 * Fund moves analytics: any metric (count, in, out, net) over any
 * bucket (time, counterpart fund, direction), grouped by any dimension —
 * the chart above the table of the plotted data. Describes the same
 * set the fund moves table shows.
 */
export function FundMovesAnalytics({
  fundId,
  subtree = false,
  accountFilter = null,
  viewId,
  defaults,
  fullView = false,
}: FundMovesAnalyticsProps) {
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const { search } = useViewSearch();

  const data = useMemo<AnalyticsDatum[]>(() => {
    const rows = getFundMovesRows({
      activities,
      accounts,
      funds,
      fundId,
      subtree,
    });

    return rows
      .filter((row) => {
        if (accountFilter !== null) {
          if (
            !row.accounts ||
            (row.accounts.from !== accountFilter &&
              row.accounts.to !== accountFilter)
          ) {
            return false;
          }
        }
        if (!search) return true;
        return (
          row.activity !== null && searchCompare(search, row.activity.name)
        );
      })
      .map((row) => ({
        date: row.date,
        count: 1,
        amount: row.direction === "in" ? row.amount : -row.amount,
        in: row.direction === "in" ? row.amount : 0,
        out: row.direction === "out" ? row.amount : 0,
        counterpartFund: row.direction === "in" ? row.fromFund : row.toFund,
        direction: row.direction,
      }));
  }, [activities, accounts, funds, fundId, subtree, accountFilter, search]);

  return (
    <AnalyticsView
      viewId={viewId}
      data={data}
      metrics={FUND_MOVES_METRICS}
      buckets={FUND_MOVES_BUCKETS}
      dimensions={FUND_MOVES_DIMENSIONS}
      defaults={defaults}
      fullView={fullView}
    />
  );
}
