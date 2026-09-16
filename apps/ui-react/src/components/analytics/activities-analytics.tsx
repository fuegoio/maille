import { ActivityType, type Activity } from "@maille/core/activities";
import { eachDayOfInterval, startOfDay } from "date-fns";
import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivityAmountsValue } from "@/components/activities/activity-amounts";
import {
  AnalyticsBreakdown,
  type AnalyticsBreakdownRow,
} from "@/components/analytics/analytics-breakdown";
import {
  AnalyticsEmpty,
  AnalyticsSection,
} from "@/components/analytics/analytics-section";
import { FundMovesBreakdown } from "@/components/analytics/fund-moves-analytics";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { flattenActivityFundMoves } from "@/logic/funds";
import {
  ACTIVITY_TYPES_CHART_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";

/** The display order of the type dimension, matching the summary blocks. */
const TYPES_ORDER = [
  ActivityType.REVENUE,
  ActivityType.EXPENSE,
  ActivityType.INVESTMENT,
  ActivityType.NEUTRAL,
] as const;

interface ActivitiesAnalyticsProps {
  /** The activities as the table sees them: same set, same filters. */
  activities: Activity[];
  fullView?: boolean;
  /** The tab filters, marking the breakdown rows' active states. */
  filters?: ActivitiesFilters;
  /** Click-to-filter: patch the tab filters. */
  onFilter?: (patch: Partial<ActivitiesFilters>) => void;
  /** Show the fund moves section for the fund flows inside the set. */
  showFundMoves?: boolean;
}

/**
 * Amounts by type, category and subcategory — the activities analytics
 * of the panel. Clicking a row filters the table to it, like the
 * summary's breakdowns.
 */
export function ActivitiesAnalytics({
  activities,
  fullView = false,
  filters,
  onFilter,
  showFundMoves = false,
}: ActivitiesAnalyticsProps) {
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);

  const totals = React.useMemo(() => {
    const amounts = {
      [ActivityType.REVENUE]: 0,
      [ActivityType.EXPENSE]: 0,
      [ActivityType.INVESTMENT]: 0,
      [ActivityType.NEUTRAL]: 0,
    } as Record<ActivityType, number>;
    for (const activity of activities) {
      for (const type of activity.types) {
        amounts[type] += activity.amounts[type];
      }
    }
    return amounts;
  }, [activities]);

  const typeRows = React.useMemo<AnalyticsBreakdownRow[]>(
    () =>
      TYPES_ORDER.map((type) => ({
        id: type,
        label: ACTIVITY_TYPES_NAME[type],
        value: totals[type],
        color: ACTIVITY_TYPES_CHART_COLOR[type],
        active: filters?.activityType === type,
        onSelect: onFilter
          ? () =>
              onFilter({
                activityType: filters?.activityType === type ? undefined : type,
              })
          : undefined,
      })),
    [totals, filters, onFilter],
  );

  const categoryRows = React.useMemo<AnalyticsBreakdownRow[]>(() => {
    const byCategory = new Map<
      string | null,
      {
        total: number;
        byType: Record<ActivityType, number>;
        bySub: Map<string | null, number>;
      }
    >();

    for (const activity of activities) {
      let entry = byCategory.get(activity.category);
      if (!entry) {
        entry = {
          total: 0,
          byType: {
            [ActivityType.REVENUE]: 0,
            [ActivityType.EXPENSE]: 0,
            [ActivityType.INVESTMENT]: 0,
            [ActivityType.NEUTRAL]: 0,
          },
          bySub: new Map(),
        };
        byCategory.set(activity.category, entry);
      }
      entry.total += activity.amount;
      for (const type of activity.types) {
        entry.byType[type] += activity.amounts[type];
      }
      const sub = entry.bySub.get(activity.subcategory) ?? 0;
      entry.bySub.set(activity.subcategory, sub + activity.amount);
    }

    const rows = [...byCategory.entries()].map(([categoryId, entry]) => {
      const category = categories.find((c) => c.id === categoryId);
      // The dominant type carries the bar's color, the way the summary's
      // segments share their type's hue.
      const dominantType = (
        Object.entries(entry.byType) as [ActivityType, number][]
      )
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .at(0)?.[0];

      return {
        id: categoryId ?? "uncategorized",
        label: category ? (
          <span className="flex min-w-0 items-center gap-1.5">
            {category.emoji && <span>{category.emoji}</span>}
            <span className="truncate">{category.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Uncategorized</span>
        ),
        value: entry.total,
        color: dominantType
          ? ACTIVITY_TYPES_CHART_COLOR[dominantType]
          : undefined,
        active:
          filters?.category === categoryId && filters.subcategory === undefined,
        // Uncategorized cannot be expressed as a tab filter, so it stays
        // a plain row.
        onSelect:
          onFilter && categoryId
            ? () =>
                onFilter({
                  category:
                    filters?.category === categoryId ? undefined : categoryId,
                  subcategory: undefined,
                })
            : undefined,
        children: [...entry.bySub.entries()]
          .filter(([subcategoryId]) => subcategoryId !== null)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
          .map(([subcategoryId, subTotal]) => {
            const subcategory = subcategories.find(
              (s) => s.id === subcategoryId,
            );
            return {
              id: subcategoryId!,
              label: subcategory ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  {subcategory.emoji && <span>{subcategory.emoji}</span>}
                  <span className="truncate">{subcategory.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Unsorted</span>
              ),
              value: subTotal,
              color: dominantType
                ? ACTIVITY_TYPES_CHART_COLOR[dominantType]
                : undefined,
              active: filters?.subcategory === subcategoryId,
              onSelect: onFilter
                ? () =>
                    onFilter({
                      category: categoryId ?? undefined,
                      subcategory:
                        filters?.subcategory === subcategoryId
                          ? undefined
                          : subcategoryId!,
                    })
                : undefined,
            };
          }),
      };
    });

    return rows.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [activities, categories, subcategories, filters, onFilter]);

  const fundMoves = React.useMemo(
    () => (showFundMoves ? flattenActivityFundMoves(activities) : []),
    [showFundMoves, activities],
  );

  return (
    <div className={cn(fullView && "mx-auto w-full max-w-5xl")}>
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-4">
        <div className="text-sm text-muted-foreground">
          {activities.length}{" "}
          {activities.length === 1 ? "activity" : "activities"}
        </div>
        <div className="flex-1" />
        <ActivityAmountsValue amounts={totals} className="text-sm" />
      </div>

      {fullView && <ActivitiesTrendChart activities={activities} />}

      <AnalyticsSection title="By type">
        <AnalyticsBreakdown
          rows={typeRows}
          emptyLabel="No activity in this view."
        />
      </AnalyticsSection>

      <AnalyticsSection title="By category">
        <AnalyticsBreakdown
          rows={categoryRows}
          emptyLabel="No category in this view."
        />
      </AnalyticsSection>

      {showFundMoves && <FundMovesBreakdown moves={fundMoves} />}
    </div>
  );
}

/**
 * Daily totals per type over the activities' own date span — the full
 * view's trend, lines colored like every type surface.
 */
function ActivitiesTrendChart({ activities }: { activities: Activity[] }) {
  const currencyFormatter = useCurrencyFormatter();

  const data = React.useMemo(() => {
    if (activities.length === 0) return [];

    const sorted = [...activities].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    const first = startOfDay(sorted[0].date);
    const last = startOfDay(sorted[sorted.length - 1].date);
    const days = eachDayOfInterval({ start: first, end: last });

    return days.map((day) => {
      const amounts = {
        revenue: 0,
        expense: 0,
        investment: 0,
        neutral: 0,
      };
      for (const activity of sorted) {
        if (startOfDay(activity.date).getTime() === day.getTime()) {
          for (const type of activity.types) {
            amounts[type] += activity.amounts[type];
          }
        }
      }
      return { date: day.toISOString(), ...amounts };
    });
  }, [activities]);

  if (data.length === 0) {
    return (
      <AnalyticsSection title="Over time">
        <AnalyticsEmpty>No activity in this view.</AnalyticsEmpty>
      </AnalyticsSection>
    );
  }

  const chartConfig = {
    [ActivityType.REVENUE]: {
      label: ACTIVITY_TYPES_NAME[ActivityType.REVENUE],
      color: ACTIVITY_TYPES_CHART_COLOR[ActivityType.REVENUE],
    },
    [ActivityType.EXPENSE]: {
      label: ACTIVITY_TYPES_NAME[ActivityType.EXPENSE],
      color: ACTIVITY_TYPES_CHART_COLOR[ActivityType.EXPENSE],
    },
    [ActivityType.INVESTMENT]: {
      label: ACTIVITY_TYPES_NAME[ActivityType.INVESTMENT],
      color: ACTIVITY_TYPES_CHART_COLOR[ActivityType.INVESTMENT],
    },
    [ActivityType.NEUTRAL]: {
      label: ACTIVITY_TYPES_NAME[ActivityType.NEUTRAL],
      color: ACTIVITY_TYPES_CHART_COLOR[ActivityType.NEUTRAL],
    },
  } satisfies ChartConfig;

  return (
    <AnalyticsSection title="Over time">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[240px] w-full"
      >
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical strokeDasharray="2 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            minTickGap={24}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[200px]"
                formatter={(value) => currencyFormatter.format(value as number)}
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
            }
          />
          {TYPES_ORDER.map((type) => (
            <Line
              key={type}
              type="stepAfter"
              dataKey={type}
              stroke={`var(--color-${type})`}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </AnalyticsSection>
  );
}
