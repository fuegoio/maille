import { ChartColumn, ChartLine } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  buildPlot,
  temporalColumnLabel,
  type AnalyticsBucket,
  type AnalyticsDatum,
  type AnalyticsDimension,
  type AnalyticsMetric,
} from "@/components/analytics/analytics-data";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import {
  ACTIVITY_TYPES_CHART_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useAnalytics, type AnalyticsConfig } from "@/stores/analytics";
import { useFunds } from "@/stores/funds";
import { useProjects } from "@/stores/projects";

interface AnalyticsViewProps {
  /** The view the chart configuration persists under. */
  viewId: string;
  /** The plottable records, already filtered like the table. */
  data: AnalyticsDatum[];
  metrics: AnalyticsMetric[];
  buckets: AnalyticsBucket[];
  /** Series dimensions, "none" first. */
  dimensions: AnalyticsDimension[];
  defaults: AnalyticsConfig;
  fullView?: boolean;
}

/**
 * The configurable analytics of every surface: Y / X / group-by selects
 * over one chart, with the plotted data as a table below — the Linear
 * insights shape. The configuration persists per view.
 */
export function AnalyticsView({
  viewId,
  data,
  metrics,
  buckets,
  dimensions,
  defaults,
  fullView = false,
}: AnalyticsViewProps) {
  const currencyFormatter = useCurrencyFormatter();

  // A stored configuration may predate the surface's options; each
  // control falls back to its default rather than plotting nothing.
  const stored = useAnalytics((state) => state.getConfig(viewId, defaults));
  const setConfig = useAnalytics((state) => state.setConfig);

  const metric =
    metrics.find((m) => m.key === stored.y) ??
    metrics.find((m) => m.key === defaults.y) ??
    metrics[0];
  const bucket =
    buckets.find((b) => b.key === stored.x) ??
    buckets.find((b) => b.key === defaults.x) ??
    buckets[0];
  const dimension =
    dimensions.find((d) => d.key === stored.groupBy) ??
    dimensions.find((d) => d.key === defaults.groupBy) ??
    dimensions[0];
  const chartKind = stored.chart ?? defaults.chart;

  const update = (patch: Partial<AnalyticsConfig>) =>
    setConfig(viewId, { ...stored, ...patch });

  const plot = useMemo(
    () => buildPlot(data, metric, bucket, dimension),
    [data, metric, bucket, dimension],
  );

  const compactFormatter = useCurrencyFormatter("compact");

  const formatValue = (value: number) =>
    metric.format === "integer"
      ? String(Math.round(value))
      : currencyFormatter.format(value);

  // Axis ticks stay compact: the tooltip carries the precise figure.
  const formatTick = (value: number) =>
    metric.format === "integer"
      ? String(Math.round(value))
      : compactFormatter.format(value);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        fullView && "mx-auto w-full max-w-5xl",
      )}
    >
      <AnalyticsControls
        metric={metric}
        bucket={bucket}
        dimension={dimension}
        chartKind={chartKind}
        metrics={metrics}
        buckets={buckets}
        dimensions={dimensions}
        onChange={update}
      />

      <AnalyticsChart
        plot={plot}
        metric={metric}
        bucket={bucket}
        dimension={dimension}
        chartKind={chartKind}
        formatValue={formatValue}
        formatTick={formatTick}
        fullView={fullView}
      />

      <AnalyticsDataTable
        plot={plot}
        metric={metric}
        bucket={bucket}
        dimension={dimension}
        formatValue={formatValue}
      />
    </div>
  );
}

function AnalyticsControls({
  metric,
  bucket,
  dimension,
  chartKind,
  metrics,
  buckets,
  dimensions,
  onChange,
}: {
  metric: AnalyticsMetric;
  bucket: AnalyticsBucket;
  dimension: AnalyticsDimension;
  chartKind: AnalyticsConfig["chart"];
  metrics: AnalyticsMetric[];
  buckets: AnalyticsBucket[];
  dimensions: AnalyticsDimension[];
  onChange: (patch: Partial<AnalyticsConfig>) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted/30 px-4 py-2">
      <label className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Show</span>
        <NativeSelect
          size="sm"
          value={metric.key}
          onChange={(event) => onChange({ y: event.target.value })}
          aria-label="Y axis"
        >
          {metrics.map((option) => (
            <NativeSelectOption key={option.key} value={option.key}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">by</span>
        <NativeSelect
          size="sm"
          value={bucket.key}
          onChange={(event) => onChange({ x: event.target.value })}
          aria-label="X axis"
        >
          {buckets.map((option) => (
            <NativeSelectOption key={option.key} value={option.key}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">grouped by</span>
        <NativeSelect
          size="sm"
          value={dimension.key}
          onChange={(event) => onChange({ groupBy: event.target.value })}
          aria-label="Group by"
        >
          {dimensions.map((option) => (
            <NativeSelectOption key={option.key} value={option.key}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </label>

      <div
        className="ml-auto flex items-center gap-0.5"
        role="group"
        aria-label="Chart type"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={chartKind === "bar"}
              aria-label="Bar chart"
              onClick={() => onChange({ chart: "bar" })}
              className={cn(chartKind === "bar" && "bg-muted hover:bg-muted")}
            >
              <ChartColumn className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bar chart</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={chartKind === "line"}
              aria-label="Line chart"
              onClick={() => onChange({ chart: "line" })}
              className={cn(chartKind === "line" && "bg-muted hover:bg-muted")}
            >
              <ChartLine className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Line chart</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function AnalyticsChart({
  plot,
  metric,
  bucket,
  dimension,
  chartKind,
  formatValue,
  formatTick,
  fullView,
}: {
  plot: ReturnType<typeof buildPlot>;
  metric: AnalyticsMetric;
  bucket: AnalyticsBucket;
  dimension: AnalyticsDimension;
  chartKind: AnalyticsConfig["chart"];
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
  fullView: boolean;
}) {
  const seriesLabels = useSeriesLabels();

  const chartData = useMemo(
    () =>
      plot.columnKeys.map((columnKey) => {
        const row: Record<string, string | number> = {
          column: bucket.temporal
            ? temporalColumnLabel(columnKey, bucket.temporal)
            : seriesLabel(seriesLabels, bucket.dimension, columnKey),
        };
        plot.seriesKeys.forEach((seriesKey, index) => {
          row[`s${index}`] = plot.values.get(`${seriesKey}|${columnKey}`) ?? 0;
        });
        return row;
      }),
    [plot, bucket, seriesLabels],
  );

  if (plot.seriesKeys.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Nothing to plot in this view.
      </div>
    );
  }

  const chartConfig: ChartConfig = {};
  for (const [index, seriesKey] of plot.seriesKeys.entries()) {
    chartConfig[`s${index}`] = {
      // An ungrouped plot names its single series after the metric.
      label:
        dimension.key === "none"
          ? metric.label
          : seriesLabel(seriesLabels, dimension.dimension, seriesKey),
      color: seriesColor(seriesLabels, dimension.dimension, seriesKey, index),
    };
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={cn(
        "aspect-auto w-full shrink-0 border-b",
        fullView ? "h-[320px]" : "h-[220px]",
      )}
    >
      {chartKind === "line" ? (
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical strokeDasharray="2 3" />
          <XAxis
            dataKey="column"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            minTickGap={24}
          />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatTick(value as number)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[220px]"
                formatter={(value) => formatValue(value as number)}
              />
            }
          />
          {plot.seriesKeys.map((seriesKey, index) => (
            <Line
              key={seriesKey}
              type="monotone"
              dataKey={`s${index}`}
              stroke={`var(--color-s${index})`}
              strokeWidth={1.5}
              // A single point draws nothing as a bare line; give it a dot.
              dot={chartData.length === 1 ? { r: 2.5, strokeWidth: 0 } : false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical strokeDasharray="2 3" />
          <XAxis
            dataKey="column"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            minTickGap={12}
          />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatTick(value as number)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[220px]"
                formatter={(value) => formatValue(value as number)}
              />
            }
          />
          {plot.seriesKeys.map((seriesKey, index) => (
            <Bar
              key={seriesKey}
              dataKey={`s${index}`}
              fill={`var(--color-s${index})`}
              // No rounded corners: net metrics flip sign and a fixed
              // radius rounds the wrong end of negative bars.
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );
}

function AnalyticsDataTable({
  plot,
  metric,
  bucket,
  dimension,
  formatValue,
}: {
  plot: ReturnType<typeof buildPlot>;
  metric: AnalyticsMetric;
  bucket: AnalyticsBucket;
  dimension: AnalyticsDimension;
  formatValue: (value: number) => string;
}) {
  const seriesLabels = useSeriesLabels();

  if (plot.seriesKeys.length === 0) {
    return null;
  }

  const columnLabel = (columnKey: string) =>
    bucket.temporal
      ? temporalColumnLabel(columnKey, bucket.temporal)
      : seriesLabel(seriesLabels, bucket.dimension, columnKey);

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr>
            <th className="sticky left-0 z-10 border-b bg-card px-3 py-2 text-left font-medium">
              {dimension.key === "none" ? metric.label : dimension.label}
            </th>
            {plot.columnKeys.map((columnKey) => (
              <th
                key={columnKey}
                className="border-b px-3 py-2 text-right font-medium whitespace-nowrap"
              >
                {columnLabel(columnKey)}
              </th>
            ))}
            <th className="border-b border-l px-3 py-2 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {plot.seriesKeys.map((seriesKey) => (
            <tr key={seriesKey} className="border-b last:border-b-0">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-normal whitespace-nowrap"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: seriesColor(
                        seriesLabels,
                        dimension.dimension,
                        seriesKey,
                        plot.seriesKeys.indexOf(seriesKey),
                      ),
                    }}
                  />
                  {dimension.key === "none"
                    ? metric.label
                    : seriesLabel(seriesLabels, dimension.dimension, seriesKey)}
                </span>
              </th>
              {plot.columnKeys.map((columnKey) => {
                const value = plot.values.get(`${seriesKey}|${columnKey}`) ?? 0;
                return (
                  <td
                    key={columnKey}
                    className={cn(
                      "px-3 py-2 text-right font-mono whitespace-nowrap tabular-nums",
                      // Zeros stay visible but quiet: a sparse plot
                      // reads by where the numbers are.
                      value === 0 && "text-muted-foreground/50",
                    )}
                  >
                    {formatValue(value)}
                  </td>
                );
              })}
              <td className="border-l px-3 py-2 text-right font-mono font-medium whitespace-nowrap tabular-nums">
                {formatValue(plot.rowTotals.get(seriesKey) ?? 0)}
              </td>
            </tr>
          ))}

          {plot.seriesKeys.length > 1 && (
            <tr className="border-t">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium whitespace-nowrap"
              >
                Total
              </th>
              {plot.columnKeys.map((columnKey) => (
                <td
                  key={columnKey}
                  className="px-3 py-2 text-right font-mono font-medium whitespace-nowrap tabular-nums"
                >
                  {formatValue(plot.columnTotals.get(columnKey) ?? 0)}
                </td>
              ))}
              <td className="border-l px-3 py-2 text-right font-mono font-medium whitespace-nowrap tabular-nums">
                {formatValue(plot.total)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The label and color resolvers of every dimension value: they read the
 * entity stores so ids never surface in the chart or the table.
 */
function useSeriesLabels() {
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const projects = useProjects((state) => state.projects);

  return useMemo(
    () => ({
      categories,
      subcategories,
      accounts,
      funds,
      projects,
    }),
    [categories, subcategories, accounts, funds, projects],
  );
}

type SeriesLabels = ReturnType<typeof useSeriesLabels>;

function seriesLabel(
  labels: SeriesLabels,
  dimension: keyof AnalyticsDatum | undefined,
  key: string,
): string {
  if (!dimension || key === "__all__") return "All";
  if (key === "__null__") {
    switch (dimension) {
      case "category":
      case "subcategory":
        return "Uncategorized";
      case "fund":
      case "counterpartFund":
        return "Untracked";
      case "direction":
        return "—";
      default:
        return "None";
    }
  }

  switch (dimension) {
    case "type":
      return (ACTIVITY_TYPES_NAME as Record<string, string>)[key] ?? key;
    case "category": {
      const category = labels.categories.find((c) => c.id === key);
      return category
        ? `${category.emoji ? `${category.emoji} ` : ""}${category.name}`
        : key;
    }
    case "subcategory": {
      const subcategory = labels.subcategories.find((s) => s.id === key);
      return subcategory
        ? `${subcategory.emoji ? `${subcategory.emoji} ` : ""}${subcategory.name}`
        : key;
    }
    case "account":
    case "counterpart":
      return labels.accounts.find((a) => a.id === key)?.name ?? key;
    case "fund": {
      const fund = labels.funds.find((f) => f.id === key);
      return fund?.name ?? key;
    }
    case "counterpartFund": {
      const fund = labels.funds.find((f) => f.id === key);
      return fund?.name ?? key;
    }
    case "status":
      return key === "completed" ? "Reconciled" : "Not reconciled";
    case "direction":
      return key === "in" ? "In" : "Out";
    case "project": {
      const project = labels.projects.find((p) => p.id === key);
      return project
        ? `${project.emoji ? `${project.emoji} ` : ""}${project.name}`
        : key;
    }
    default:
      return key;
  }
}

function seriesColor(
  labels: SeriesLabels,
  dimension: keyof AnalyticsDatum | undefined,
  key: string,
  index: number,
): string {
  if (!dimension) return "var(--primary)";

  if (dimension === "type") {
    return (
      (ACTIVITY_TYPES_CHART_COLOR as Record<string, string>)[key] ??
      "var(--primary)"
    );
  }

  if (dimension === "fund" || dimension === "counterpartFund") {
    const fund = labels.funds.find((f) => f.id === key);
    if (fund) return fund.color;
    // Untracked and deleted funds read as quiet gray.
    return "var(--muted-foreground)";
  }

  // The Ledger Green ramp, cycling for long dimension lists.
  const ramp = [
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-1)",
  ];
  return ramp[index % ramp.length];
}
