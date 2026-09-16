import type { ActivityType } from "@maille/core/activities";

import {
  eachDayOfInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/**
 * One plottable record. Each analytics surface flattens its entity into
 * these; the engine aggregates them along any Y metric, X bucket and
 * series dimension without knowing the entity.
 */
export type AnalyticsDatum = {
  date: Date;
  /** The count weight: 1 per record. */
  count: number;
  /** The signed net amount. */
  amount: number;
  /** The inflow and outflow magnitudes. */
  in: number;
  out: number;
  /** The reconciled (completed) amount magnitude, where statuses exist. */
  reconciled?: number;
  type?: ActivityType | null;
  category?: string | null;
  subcategory?: string | null;
  account?: string | null;
  counterpart?: string | null;
  fund?: string | null;
  counterpartFund?: string | null;
  status?: string | null;
  direction?: "in" | "out" | null;
  project?: string | null;
};

/** A Y metric: how records combine into plotted values. */
export type AnalyticsMetric = {
  key: string;
  label: string;
  format: "currency" | "integer";
  value: (datum: AnalyticsDatum) => number;
};

/** An X bucket: a date granularity or a record dimension. */
export type AnalyticsBucket = {
  key: string;
  label: string;
  /** Set when the bucket is temporal. */
  temporal?: "day" | "week" | "month";
  /** Set when the bucket is a record dimension. */
  dimension?: keyof AnalyticsDatum;
};

/** The series dimension options, "none" included. */
export type AnalyticsDimension = {
  key: string;
  label: string;
  dimension?: keyof AnalyticsDatum;
};

export const NONE_DIMENSION: AnalyticsDimension = {
  key: "none",
  label: "None",
};

const countMetric: AnalyticsMetric = {
  key: "count",
  label: "Count",
  format: "integer",
  value: (datum) => datum.count,
};

const netMetric: AnalyticsMetric = {
  key: "net",
  label: "Net",
  format: "currency",
  value: (datum) => datum.amount,
};

const inMetric: AnalyticsMetric = {
  key: "in",
  label: "In",
  format: "currency",
  value: (datum) => datum.in,
};

const outMetric: AnalyticsMetric = {
  key: "out",
  label: "Out",
  format: "currency",
  value: (datum) => datum.out,
};

const reconciledMetric: AnalyticsMetric = {
  key: "reconciled",
  label: "Reconciled",
  format: "currency",
  value: (datum) => datum.reconciled ?? 0,
};

/** The Y metrics of flows: money with a direction. */
export const FLOW_METRICS: AnalyticsMetric[] = [
  countMetric,
  inMetric,
  outMetric,
  netMetric,
  reconciledMetric,
];

/** The activities' type metrics: per-type sums, matching the amounts
 * vocabulary of the tables and summaries. */
export const ACTIVITY_TYPE_METRICS: AnalyticsMetric[] = (
  ["revenue", "expense", "investment", "neutral"] as ActivityType[]
).map((type) => ({
  key: type,
  label: type.charAt(0).toUpperCase() + type.slice(1),
  format: "currency" as const,
  value: (datum: AnalyticsDatum) => (datum.type === type ? datum.amount : 0),
}));

/** The temporal X buckets every surface shares. */
export const TEMPORAL_BUCKETS: AnalyticsBucket[] = [
  { key: "day", label: "Day", temporal: "day" },
  { key: "week", label: "Week", temporal: "week" },
  { key: "month", label: "Month", temporal: "month" },
];

const bucketFor = (bucket: AnalyticsBucket, date: Date): Date =>
  bucket.temporal === "day"
    ? startOfDay(date)
    : bucket.temporal === "week"
      ? startOfWeek(date, { weekStartsOn: 1 })
      : startOfMonth(date);

/**
 * The aggregated plot: series over columns, the chart and the table's
 * two views of the same numbers.
 */
export type AnalyticsPlot = {
  /** Series keys in display order, raw dimension values. */
  seriesKeys: string[];
  /** Column keys in display order: bucket start ISO or raw dimension value. */
  columnKeys: string[];
  /** series|column → value. */
  values: Map<string, number>;
  rowTotals: Map<string, number>;
  total: number;
};

export function buildPlot(
  data: AnalyticsDatum[],
  metric: AnalyticsMetric,
  bucket: AnalyticsBucket,
  group: AnalyticsDimension,
): AnalyticsPlot {
  const seriesOf = (datum: AnalyticsDatum): string =>
    !group.dimension ? "__all__" : String(datum[group.dimension] ?? "__null__");
  const columnOf = (datum: AnalyticsDatum): string =>
    bucket.temporal
      ? bucketFor(bucket, datum.date).toISOString()
      : String(
          bucket.dimension
            ? (datum[bucket.dimension] ?? "__null__")
            : "__all__",
        );

  const values = new Map<string, number>();
  const rowTotals = new Map<string, number>();
  const columnTotals = new Map<string, number>();
  let minBucket: Date | null = null;
  let maxBucket: Date | null = null;

  for (const datum of data) {
    const seriesKey = seriesOf(datum);
    const columnKey = columnOf(datum);
    const value = metric.value(datum);

    const cellKey = `${seriesKey}|${columnKey}`;
    values.set(cellKey, (values.get(cellKey) ?? 0) + value);
    rowTotals.set(seriesKey, (rowTotals.get(seriesKey) ?? 0) + value);
    columnTotals.set(columnKey, (columnTotals.get(columnKey) ?? 0) + value);

    if (bucket.temporal) {
      const bucketDate = new Date(columnKey);
      if (!minBucket || bucketDate < minBucket) minBucket = bucketDate;
      if (!maxBucket || bucketDate > maxBucket) maxBucket = bucketDate;
    }
  }

  // Temporal columns run the full span, even where nothing happened; a
  // categorical X lists its values by total, largest first.
  let columnKeys: string[];
  if (bucket.temporal && minBucket && maxBucket) {
    const days = eachDayOfInterval({ start: minBucket, end: maxBucket });
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const day of days) {
      const bucketDate = bucketFor(bucket, day);
      const key = bucketDate.toISOString();
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
    columnKeys = keys;
  } else {
    columnKeys = [...columnTotals.keys()].sort(
      (a, b) =>
        Math.abs(columnTotals.get(b) ?? 0) - Math.abs(columnTotals.get(a) ?? 0),
    );
  }

  const seriesKeys = [...rowTotals.keys()].sort(
    (a, b) => Math.abs(rowTotals.get(b) ?? 0) - Math.abs(rowTotals.get(a) ?? 0),
  );

  let total = 0;
  for (const value of rowTotals.values()) {
    total += value;
  }

  return { seriesKeys, columnKeys, values, rowTotals, total };
}

/** The table label of a temporal column: its bucket's start date. */
export function temporalColumnLabel(
  key: string,
  temporal: "day" | "week" | "month",
): string {
  const date = new Date(key);
  if (temporal === "month") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export { countMetric, netMetric, inMetric, outMetric, reconciledMetric };
