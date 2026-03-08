import type { ActivityCategory } from "@maille/core/activities";

import { Link } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay, subDays } from "date-fns";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { CreateSubcategoryDialog } from "@/components/categories/create-subcategory-dialog";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useActivities, ACTIVITY_TYPES_CHART_COLOR } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

interface CategorySummaryProps {
  category: ActivityCategory;
}

export function CategorySummary({ category }: CategorySummaryProps) {
  const currencyFormatter = useCurrencyFormatter();
  const user = useAuth((state) => state.user!);
  const activities = useActivities((state) => state.activities);
  const subcategories = useActivities((state) => state.activitySubcategories);

  const categoryActivities = useMemo(
    () => activities.filter((a) => a.category === category.id),
    [activities, category.id],
  );

  const totalOverall = useMemo(
    () => categoryActivities.reduce((acc, a) => acc + a.amount, 0),
    [categoryActivities],
  );

  const total30Days = useMemo(() => {
    const cutoff = startOfDay(subDays(new Date(), 30));
    return categoryActivities
      .filter((a) => startOfDay(a.date) >= cutoff)
      .reduce((acc, a) => acc + a.amount, 0);
  }, [categoryActivities]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: user.startingDate,
        end: new Date(),
      }),
    [user.startingDate],
  );

  const chartData = useMemo(
    () =>
      days.map((date) => {
        const d = startOfDay(date);
        return {
          date: date.toISOString(),
          value: categoryActivities
            .filter((a) => startOfDay(a.date).getTime() === d.getTime())
            .reduce((acc, a) => acc + a.amount, 0),
        };
      }),
    [days, categoryActivities],
  );

  const chartConfig = {
    views: { label: "Total" },
    value: {
      label: "Amount",
      color:
        ACTIVITY_TYPES_CHART_COLOR[category.type] ?? "var(--color-red-400)",
    },
  } satisfies ChartConfig;

  const categorySubcategories = useMemo(
    () =>
      subcategories
        .filter((sc) => sc.category === category.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [subcategories, category.id],
  );

  const subcategoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    categorySubcategories.forEach((sc) => {
      totals[sc.id] = activities
        .filter((a) => a.subcategory === sc.id)
        .reduce((acc, a) => acc + a.amount, 0);
    });
    return totals;
  }, [activities, categorySubcategories]);

  return (
    <div>
      {/* KPIs + chart */}
      <div className="w-full border-b">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="font-semibold">Last 30 days</div>
            <div className="flex-1" />
            <span className="font-mono">
              {currencyFormatter.format(total30Days)}
            </span>
          </div>

          <div className="mt-3 flex items-center text-sm">
            <div className="font-medium text-muted-foreground">Total</div>
            <div className="flex-1" />
            <span className="font-mono text-muted-foreground">
              {currencyFormatter.format(totalOverall)}
            </span>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] w-full border-t p-3"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  formatter={(value) =>
                    currencyFormatter.format(value as number)
                  }
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Subcategories */}
      <div className="w-full border-b px-3 py-4">
        <div className="mb-1 flex h-10 items-center justify-between rounded px-3">
          <span className="font-medium">Subcategories</span>
          <CreateSubcategoryDialog categoryId={category.id}>
            <Button variant="ghost" size="icon">
              <Plus />
            </Button>
          </CreateSubcategoryDialog>
        </div>

        {categorySubcategories.length === 0 && (
          <div className="px-3 py-3 text-sm text-muted-foreground">
            No subcategories yet
          </div>
        )}

        {categorySubcategories.map((sc) => (
          <Link
            key={sc.id}
            to="/categories/$id/subcategories/$subcategoryId"
            params={{ id: category.id, subcategoryId: sc.id }}
            className="group flex h-9 items-center rounded px-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {sc.emoji && <span>{sc.emoji}</span>}
              <span>{sc.name}</span>
            </div>
            <div className="flex-1" />
            <span className="pr-2 font-mono text-sm whitespace-nowrap">
              {currencyFormatter.format(subcategoryTotals[sc.id] ?? 0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
