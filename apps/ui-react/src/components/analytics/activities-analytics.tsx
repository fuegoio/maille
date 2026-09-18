import type { Activity } from "@maille/core/activities";

import { useMemo } from "react";

import type { AnalyticsConfig } from "@/stores/analytics";

import {
  ACTIVITY_TYPE_METRICS,
  countMetric,
  netMetric,
  TEMPORAL_BUCKETS,
  NONE_DIMENSION,
  type AnalyticsBucket,
  type AnalyticsDatum,
  type AnalyticsDimension,
  type AnalyticsMetric,
} from "@/components/analytics/analytics-data";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const ACTIVITIES_METRICS: AnalyticsMetric[] = [
  countMetric,
  netMetric,
  ...ACTIVITY_TYPE_METRICS,
];

const ACTIVITIES_BUCKETS: AnalyticsBucket[] = [
  ...TEMPORAL_BUCKETS,
  { key: "type", label: "Type", dimension: "type" },
  { key: "category", label: "Category", dimension: "category" },
  { key: "subcategory", label: "Subcategory", dimension: "subcategory" },
  { key: "project", label: "Project", dimension: "project" },
];

const ACTIVITIES_DIMENSIONS: AnalyticsDimension[] = [
  NONE_DIMENSION,
  { key: "type", label: "Type", dimension: "type" },
  { key: "category", label: "Category", dimension: "category" },
  { key: "subcategory", label: "Subcategory", dimension: "subcategory" },
  { key: "project", label: "Project", dimension: "project" },
];

interface ActivitiesAnalyticsProps {
  /** The activities as the table sees them: same set, same filters. */
  activities: Activity[];
  /** The view the chart configuration persists under. */
  viewId: string;
  defaults: AnalyticsConfig;
  fullView?: boolean;
}

/**
 * Activities analytics: any metric (count, net, per type) over any
 * bucket (time, type, category, subcategory, project), grouped by any
 * dimension — the chart above the table of the plotted data.
 */
export function ActivitiesAnalytics({
  activities,
  viewId,
  defaults,
  fullView = false,
}: ActivitiesAnalyticsProps) {
  // An activity carrying several types is one record per type, its
  // amount the type's own: bucketing by type never blends the others in.
  const data = useMemo<AnalyticsDatum[]>(
    () =>
      activities.flatMap((activity) =>
        activity.types.map((type) => ({
          date: activity.date,
          count: 1,
          amount: activity.amounts[type],
          in: 0,
          out: 0,
          type,
          category: activity.category,
          subcategory: activity.subcategory,
          project: activity.project,
        })),
      ),
    [activities],
  );

  return (
    <AnalyticsView
      viewId={viewId}
      data={data}
      metrics={ACTIVITIES_METRICS}
      buckets={ACTIVITIES_BUCKETS}
      dimensions={ACTIVITIES_DIMENSIONS}
      defaults={defaults}
      fullView={fullView}
    />
  );
}
